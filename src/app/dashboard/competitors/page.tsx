"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, Suspense } from "react";
import useSWR from "swr";
import LeaderboardCard from "@/components/dashboard/competitors/LeaderboardCard";
import type { LeaderboardEntry } from "@/components/dashboard/competitors/LeaderboardTable";
import ShareOfVoiceDonut from "@/components/dashboard/competitors/ShareOfVoiceDonut";
import OverlapHeatmap from "@/components/dashboard/competitors/OverlapHeatmap";
import QueriesDrillDown from "@/components/dashboard/competitors/QueriesDrillDown";
import type { QueryRow } from "@/components/dashboard/competitors/QueriesDrillDown";

const OVERVIEW_URL = "/api/visibility-scores/overview";
const LEADERBOARD_URL = (d: string) => `/api/competitors/leaderboard?domain=${encodeURIComponent(d)}`;
const QUERIES_URL = (domain: string, competitor: string) =>
  `/api/competitors/queries?domain=${encodeURIComponent(domain)}&competitor=${encodeURIComponent(competitor)}`;

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type OverviewData = {
  domain: string | null;
  domains: { domain: string; score: number }[];
};

type LeaderboardData = {
  domain: string;
  entries: LeaderboardEntry[];
};

type QueriesData = {
  domain: string;
  competitor: string;
  queries: QueryRow[];
};

const CARD_CLASS =
  "rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm";

function CompetitiveAnalysisContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const domainParam = searchParams.get("domain");

  const [selectedCompetitor, setSelectedCompetitor] = useState<string | null>(null);

  const overviewUrl = domainParam
    ? `${OVERVIEW_URL}?domain=${encodeURIComponent(domainParam)}`
    : OVERVIEW_URL;
  const { data: overview } = useSWR<OverviewData>(overviewUrl, fetcher);
  const domain = overview?.domain ?? domainParam ?? "";

  const leaderboardUrl = domain ? LEADERBOARD_URL(domain) : null;
  const { data: leaderboard, error: leaderboardError, isLoading: leaderboardLoading } = useSWR<LeaderboardData>(
    leaderboardUrl,
    fetcher,
    { revalidateOnFocus: false }
  );

  const queriesUrl =
    domain && selectedCompetitor ? QUERIES_URL(domain, selectedCompetitor) : null;
  const { data: queriesData } = useSWR<QueriesData>(queriesUrl, fetcher, {
    revalidateOnFocus: false,
    isPaused: () => !selectedCompetitor,
  });

  const handleSelectCompetitor = useCallback((comp: string) => {
    setSelectedCompetitor((c) => (c === comp ? null : comp));
  }, []);

  const entries = leaderboard?.entries ?? [];
  const donutData = entries
    .filter((e) => !e.isTarget && (e.shareOfVoice ?? 0) > 0)
    .map((e) => ({ name: e.domain, value: e.shareOfVoice ?? 0 }));

  const overlapEntries = entries.map((e) => ({
    domain: e.domain,
    overlapPercent: e.overlapPercent,
  }));

  return (
    <div className="mx-auto max-w-5xl min-h-0 px-6 py-6">
      {/* Page header: clear hierarchy, 16px between title and subtitle */}
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--fg)] md:text-[28px]">
          Competitive Analysis
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-[var(--muted-secondary)] md:text-base" style={{ fontSize: "14px" }}>
          Leaderboard, share of voice, and query overlap
        </p>
      </header>

      {/* Filter bar: label above, 40px height, 16–24px margin below */}
      {overview?.domains && overview.domains.length > 1 && (
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--muted)]">
              Selected Domain
            </label>
            <select
              className="h-10 min-h-[40px] min-w-[200px] rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--fg)] transition-[border-color,box-shadow] duration-200 focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-1"
              value={domain}
              onChange={(e) => {
                const next = e.target.value;
                router.push(
                  next
                    ? `/dashboard/competitors?domain=${encodeURIComponent(next)}`
                    : "/dashboard/competitors"
                );
              }}
            >
              {overview.domains.map((d) => (
                <option key={d.domain} value={d.domain}>
                  {d.domain} ({d.score.toFixed(1)})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {!domain && (
        <div className={`${CARD_CLASS} p-8 text-center text-[var(--muted-placeholder)]`}>
          No domains with visibility data. Ingest some citations first.
        </div>
      )}

      {domain && leaderboardLoading && (
        <div className={CARD_CLASS}>
          <div className="h-48 animate-pulse rounded-lg bg-[var(--surface-elevated)]" />
        </div>
      )}

      {domain && leaderboardError && (
        <div className="rounded-xl border border-[var(--danger)]/30 bg-[var(--danger-soft)] p-5 text-[var(--danger)] shadow-sm">
          Failed to load leaderboard. {leaderboardError.message}
        </div>
      )}

      {domain && leaderboard && !leaderboardLoading && (
        <>
          <div className="space-y-6">
            {/* Leaderboard — primary focus */}
            <div className={CARD_CLASS}>
              <h2 className="mb-4 text-lg font-semibold text-[var(--fg)]">
                Leaderboard
              </h2>
              <LeaderboardCard
                entries={entries}
                onSelectCompetitor={handleSelectCompetitor}
              />
            </div>

            {/* Share of voice — directly below Leaderboard, full width */}
            <div className={CARD_CLASS}>
              <ShareOfVoiceDonut data={donutData} />
            </div>

            {/* Query Overlap — full width */}
            <div className={`${CARD_CLASS} mb-8`}>
              <OverlapHeatmap
                targetDomain={domain}
                entries={overlapEntries}
                onSelectCompetitor={handleSelectCompetitor}
              />
            </div>
          </div>

          {selectedCompetitor && (
            <div className={CARD_CLASS}>
              <h2 className="mb-4 text-lg font-semibold text-[var(--fg)]">
                Drill-down
              </h2>
              <QueriesDrillDown
                targetDomain={domain}
                competitorDomain={selectedCompetitor}
                queries={queriesData?.queries ?? []}
                onClose={() => setSelectedCompetitor(null)}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function CompetitiveAnalysisPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl px-6 py-6">
          <div className="h-48 animate-pulse rounded-xl bg-[var(--surface-elevated)]" />
        </div>
      }
    >
      <CompetitiveAnalysisContent />
    </Suspense>
  );
}
