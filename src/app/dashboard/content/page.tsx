"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, Suspense } from "react";
import useSWR from "swr";
import UrlLeaderboard from "@/components/dashboard/content/UrlLeaderboard";
import type { PageRow } from "@/components/dashboard/content/UrlLeaderboard";
import PerformanceDistribution from "@/components/dashboard/content/PerformanceDistribution";
import QueryContextModal from "@/components/dashboard/content/QueryContextModal";

const OVERVIEW_URL = "/api/visibility-scores/overview";
const PAGES_URL = (d: string) =>
  `/api/pages?domain=${encodeURIComponent(d)}&limit=1000&view=all`;

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type OverviewData = {
  domain: string | null;
  domains: { domain: string; score: number }[];
};

type PagesData = {
  domain: string;
  pages: PageRow[];
  total: number;
};

function ContentPerformanceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const domainParam = searchParams.get("domain");

  const [modalUrl, setModalUrl] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const overviewUrl = domainParam
    ? `${OVERVIEW_URL}?domain=${encodeURIComponent(domainParam)}`
    : OVERVIEW_URL;
  const { data: overview } = useSWR<OverviewData>(overviewUrl, fetcher);
  const domain = overview?.domain ?? domainParam ?? "";

  const pagesUrl = domain ? PAGES_URL(domain) : null;
  const { data: pagesData, error, isLoading } = useSWR<PagesData>(pagesUrl, fetcher);

  const handleRowClick = useCallback((url: string) => {
    setModalUrl(url);
    setModalOpen(true);
  }, []);

  const handleOpenChange = useCallback((open: boolean) => {
    setModalOpen(open);
    if (!open) setModalUrl(null);
  }, []);

  const pages = pagesData?.pages ?? [];
  const pageRows: PageRow[] = pages.map((p) => ({
    url: p.url,
    domain: p.domain,
    citationCount: p.citationCount,
    uniqueQueryCount: p.uniqueQueryCount,
    avgPosition: p.avgPosition,
    lastCitedAt: p.lastCitedAt,
    computedAt: p.computedAt,
    canonicalUrl: p.canonicalUrl,
  }));

  return (
    <main className="p-6 md:p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--fg)]">
          Content performance
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)] leading-relaxed">
          URL leaderboard, citation concentration, and query context · Audit tool
        </p>
      </header>

      {overview?.domains && overview.domains.length > 1 && (
        <div className="mb-6">
          <label className="text-sm text-[var(--muted)]">Domain </label>
          <select
            className="ml-2 rounded-searchable border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--fg)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            value={domain}
            onChange={(e) => {
              const next = e.target.value;
              router.push(
                next
                  ? `/dashboard/content?domain=${encodeURIComponent(next)}`
                  : "/dashboard/content"
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
        <div className="rounded-searchable-lg border border-[var(--border)] bg-[var(--surface)] p-8 text-center text-[var(--muted)]">
          No domains with visibility data. Ingest citations and run URL metrics first.
        </div>
      )}

      {domain && isLoading && (
        <div className="rounded-searchable-lg border border-[var(--border)] bg-[var(--surface)] p-8">
          <div className="h-48 animate-pulse rounded-lg bg-[var(--surface-elevated)]" />
        </div>
      )}

      {domain && error && (
        <div className="rounded-searchable-lg border border-[var(--danger)]/30 bg-[var(--danger-soft)] p-6 text-[var(--danger)]">
          Failed to load pages. {(error as Error).message}
        </div>
      )}

      {domain && pagesData && !isLoading && (
        <section className="mx-auto max-w-6xl space-y-8">
          <div>
            <h2 className="mb-3 text-lg font-semibold text-[var(--fg)]">
              Performance distribution
            </h2>
            <PerformanceDistribution pages={pageRows} />
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold text-[var(--fg)]">
              URL leaderboard
            </h2>
            <UrlLeaderboard pages={pageRows} onRowClick={handleRowClick} />
          </div>
        </section>
      )}

      <QueryContextModal
        url={modalUrl}
        open={modalOpen}
        onOpenChange={handleOpenChange}
      />
    </main>
  );
}

export default function ContentPerformancePage() {
  return (
    <Suspense
      fallback={
        <main className="p-6 md:p-8">
          <div className="h-48 animate-pulse rounded-searchable-lg bg-[var(--surface-elevated)]" />
        </main>
      }
    >
      <ContentPerformanceContent />
    </Suspense>
  );
}
