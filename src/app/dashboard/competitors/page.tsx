"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, Suspense } from "react";
import useSWR from "swr";
import LeaderboardTable from "@/components/dashboard/competitors/LeaderboardTable";
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
    <main className="p-6 md:p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Competitive Analysis
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Leaderboard, share of voice, and query overlap · Click a competitor to see which queries they’re winning
        </p>
      </header>

      {overview?.domains && overview.domains.length > 1 && (
        <div className="mb-6">
          <label className="text-sm text-zinc-400">Domain </label>
          <select
            className="ml-2 rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
      )}

      {!domain && (
        <div className="rounded-xl border border-zinc-700/50 bg-zinc-900/50 p-8 text-center text-zinc-500">
          No domains with visibility data. Ingest some citations first.
        </div>
      )}

      {domain && leaderboardLoading && (
        <div className="rounded-xl border border-zinc-700/50 bg-zinc-900/50 p-8">
          <div className="h-48 animate-pulse rounded bg-zinc-800" />
        </div>
      )}

      {domain && leaderboardError && (
        <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-6 text-red-400">
          Failed to load leaderboard. {leaderboardError.message}
        </div>
      )}

      {domain && leaderboard && !leaderboardLoading && (
        <section className="mx-auto max-w-5xl space-y-8">
          <div>
            <h2 className="mb-3 text-lg font-semibold text-white">
              Leaderboard
            </h2>
            <LeaderboardTable
              entries={entries}
              onSelectCompetitor={handleSelectCompetitor}
            />
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h2 className="mb-3 text-lg font-semibold text-white">
                Share of voice
              </h2>
              <ShareOfVoiceDonut data={donutData} />
            </div>
            <div>
              <h2 className="mb-3 text-lg font-semibold text-white">
                Overlap heatmap
              </h2>
              <OverlapHeatmap
                targetDomain={domain}
                entries={overlapEntries}
                onSelectCompetitor={handleSelectCompetitor}
              />
            </div>
          </div>

          {selectedCompetitor && (
            <div>
              <h2 className="mb-3 text-lg font-semibold text-white">
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
        </section>
      )}
    </main>
  );
}

export default function CompetitiveAnalysisPage() {
  return (
    <Suspense
      fallback={
        <main className="p-6 md:p-8">
          <div className="h-48 animate-pulse rounded-xl bg-zinc-800/50" />
        </main>
      }
    >
      <CompetitiveAnalysisContent />
    </Suspense>
  );
}
