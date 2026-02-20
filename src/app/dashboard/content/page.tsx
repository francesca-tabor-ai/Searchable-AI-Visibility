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

const CARD_CLASS =
  "rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm";

function formatResultCount(n: number): string {
  if (n === 0) return "0 results";
  if (n === 1) return "1 result";
  return `${n} results`;
}

function ContentPerformanceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const domainParam = searchParams.get("domain");

  const [modalUrl, setModalUrl] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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
    <div className="mx-auto max-w-5xl px-6 py-6">
      {/* Page header: H1 + subtitle, 16–24px below */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--fg)] md:text-[28px]">
          Content Performance
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-[var(--muted-secondary)] md:text-base">
          URL leaderboard, citation concentration, and query context
        </p>
      </header>

      {!domain && (
        <div className={`${CARD_CLASS} p-8 text-center text-[var(--muted-secondary)]`}>
          No domains with visibility data. Run{" "}
          <code className="rounded bg-[var(--surface-elevated)] px-1.5 py-0.5 text-sm">npm run db:seed</code> then{" "}
          <code className="rounded bg-[var(--surface-elevated)] px-1.5 py-0.5 text-sm">npm run script:url-metrics</code> to populate data.
        </div>
      )}

      {domain && isLoading && (
        <div className="space-y-8">
          <div className={`${CARD_CLASS} p-6 md:p-8`}>
            <div className="h-64 animate-pulse rounded-lg bg-[var(--surface-elevated)]" />
          </div>
          <div className={`${CARD_CLASS} p-6 md:p-8`}>
            <div className="h-64 animate-pulse rounded-lg bg-[var(--surface-elevated)]" />
          </div>
        </div>
      )}

      {domain && error && (
        <div className="rounded-xl border border-[var(--danger)]/30 bg-[var(--danger-soft)] p-6 text-[var(--danger)] shadow-sm">
          Failed to load pages. {(error as Error).message}
        </div>
      )}

      {domain && pagesData && !isLoading && pageRows.length === 0 && (
        <div className={`${CARD_CLASS} p-8 text-center`}>
          <p className="font-medium text-[var(--fg)]">No URL metrics for this domain yet.</p>
          <p className="mt-3 text-sm text-[var(--muted-secondary)]">
            Connect sources or run the audit tool. The URL leaderboard is built from <em>url_performance_metrics</em>. Ingest data via{" "}
            <code className="rounded bg-[var(--surface-elevated)] px-1.5 py-0.5 text-sm">/api/ingest</code> or run{" "}
            <code className="rounded bg-[var(--surface-elevated)] px-1.5 py-0.5 text-sm">npm run db:seed</code>, then{" "}
            <code className="rounded bg-[var(--surface-elevated)] px-1.5 py-0.5 text-sm">npm run script:url-metrics</code>.
          </p>
        </div>
      )}

      {domain && pagesData && !isLoading && pageRows.length > 0 && (
        <>
          {/* Filter bar card: Domain (left) + Search (right); 40px controls, 12–16px gap; mobile stack */}
          <div className={`${CARD_CLASS} p-5 mb-8`}>
            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:gap-4">
              {overview?.domains && overview.domains.length > 1 && (
                <div className="flex-1 min-w-0 sm:min-w-[200px]">
                  <label className="mb-2 block text-sm font-medium text-[var(--muted)]">
                    Domain
                  </label>
                  <select
                    className="h-10 w-full min-h-[40px] rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--fg)] transition-[border-color,box-shadow] duration-200 focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-1"
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
              <div className="flex-1 min-w-0 sm:min-w-[200px]">
                <label className="mb-2 block text-sm font-medium text-[var(--muted)]">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Search URL…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 w-full min-h-[40px] rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--fg)] placeholder-[var(--muted)] transition-[border-color,box-shadow] duration-200 focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-1"
                />
              </div>
            </div>
          </div>

          {/* Section spacing 24–32px */}
          <section className="space-y-8">
            <PerformanceDistribution pages={pageRows} isLoading={isLoading} />

            <div className={`${CARD_CLASS} p-5 md:p-6`}>
              <UrlLeaderboard
                pages={pageRows}
                onRowClick={handleRowClick}
                globalFilter={searchQuery}
                onGlobalFilterChange={setSearchQuery}
                resultCountLabel={formatResultCount}
              />
            </div>
          </section>
        </>
      )}

      <QueryContextModal
        url={modalUrl}
        open={modalOpen}
        onOpenChange={handleOpenChange}
      />
    </div>
  );
}

export default function ContentPerformancePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl px-6 py-6">
          <div className="h-48 animate-pulse rounded-xl bg-[var(--surface-elevated)]" />
        </div>
      }
    >
      <ContentPerformanceContent />
    </Suspense>
  );
}
