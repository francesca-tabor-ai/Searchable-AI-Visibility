"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, Suspense } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import { LineChart } from "@tremor/react";
import TrendsErrorBoundary from "@/components/dashboard/TrendsErrorBoundary";
import { sanitizeTrendsData } from "@/lib/trends/sanitizeTrendsData";

const OVERVIEW_URL = "/api/visibility-scores/overview";
const TRENDS_URL = (d: string, range: string) =>
  `/api/trends?domain=${encodeURIComponent(d)}&range=${range}`;

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type OverviewData = {
  domain: string | null;
  domains: { domain: string; score: number }[];
};

const RANGES = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
] as const;

const CARD_CLASS =
  "rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm";
const CHART_MIN_HEIGHT = 320;

function TrendsContentInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const domainParam = searchParams.get("domain");
  const [range, setRange] = useState<"7d" | "30d" | "90d">("30d");

  const overviewUrl = domainParam
    ? `${OVERVIEW_URL}?domain=${encodeURIComponent(domainParam)}`
    : OVERVIEW_URL;
  const { data: overview } = useSWR<OverviewData>(overviewUrl, fetcher);
  const domain = overview?.domain ?? domainParam ?? "";

  const trendsUrl = domain ? TRENDS_URL(domain, range) : null;
  const { data: rawTrends, error: fetchError, isLoading } = useSWR<unknown>(trendsUrl, fetcher);

  const sanitized = useMemo(() => {
    if (!rawTrends && !fetchError) return null;
    if (fetchError) return { status: "error" as const, error: (fetchError as Error).message };
    // Prefer API error message when response is an error object (e.g. 400 "Missing required query parameter: domain")
    const apiError =
      rawTrends &&
      typeof rawTrends === "object" &&
      "error" in rawTrends &&
      typeof (rawTrends as { error?: unknown }).error === "string"
        ? (rawTrends as { error: string }).error
        : null;
    if (apiError) return { status: "error" as const, error: apiError };
    return sanitizeTrendsData(rawTrends);
  }, [rawTrends, fetchError]);

  const chartData = useMemo(() => {
    if (!sanitized || sanitized.status === "error") return [];
    const { data } = sanitized;
    if (!data?.series?.length) return [];
    const targetLabel = "You";
    const c1 = data.domains.competitor1 ? "Competitor 1" : null;
    const c2 = data.domains.competitor2 ? "Competitor 2" : null;
    return data.series.map((s) => {
      const row: Record<string, string | number | null> = {
        date: s.date,
        [targetLabel]: s.score != null ? Math.round(s.score * 10) / 10 : null,
      };
      if (c1) row[c1] = s.scoreCompetitor1 != null ? Math.round(s.scoreCompetitor1 * 10) / 10 : null;
      if (c2) row[c2] = s.scoreCompetitor2 != null ? Math.round(s.scoreCompetitor2 * 10) / 10 : null;
      return row;
    });
  }, [sanitized]);

  const categories = useMemo(() => {
    if (!sanitized || sanitized.status === "error") return [];
    const data = "data" in sanitized ? sanitized.data : null;
    if (!data) return [];
    const c: string[] = ["You"];
    if (data.domains.competitor1) c.push("Competitor 1");
    if (data.domains.competitor2) c.push("Competitor 2");
    return c;
  }, [sanitized]);

  const dataIssue = sanitized?.status === "error";
  const emptyData = sanitized?.status === "empty" || (sanitized?.status === "ok" && (!chartData || chartData.length === 0));
  const hasChartData = chartData.length > 0 && categories.length > 0;
  const trends = sanitized?.status === "ok" || sanitized?.status === "empty" ? sanitized.data : null;

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--fg)] md:text-[28px]">
          Visibility Trends
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-[var(--muted-secondary)] md:text-base">
          Score over time vs top competitors · 7-day rolling average
        </p>
      </header>

      {/* Filter bar: Domain + Date range; 40px height, 12px padding; stack on small */}
      <div className={`${CARD_CLASS} p-5 mb-6`}>
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
                    next ? `/dashboard/trends?domain=${encodeURIComponent(next)}` : "/dashboard/trends"
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
          <div className="flex-1 min-w-0 sm:min-w-[180px]">
            <label className="mb-2 block text-sm font-medium text-[var(--muted)]">
              Date range
            </label>
            <div className="flex flex-wrap gap-2">
              {RANGES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRange(r.value)}
                  className={`h-10 min-h-[40px] rounded-lg px-3 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-1 ${
                    range === r.value
                      ? "bg-[var(--accent)] text-white shadow-sm"
                      : "border border-[var(--border)] bg-[var(--bg)] text-[var(--fg)] hover:bg-[var(--surface-elevated)]"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {!domain && (
        <div className={`${CARD_CLASS} p-8 text-center text-[var(--muted-secondary)]`}>
          No domains with visibility data.
        </div>
      )}

      {domain && isLoading && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`${CARD_CLASS} p-6`}>
                <div className="h-4 w-24 animate-pulse rounded bg-[var(--surface-elevated)]" />
                <div className="mt-2 h-8 w-16 animate-pulse rounded bg-[var(--surface-elevated)]" />
              </div>
            ))}
          </div>
          <div className={`${CARD_CLASS} p-6`} style={{ minHeight: CHART_MIN_HEIGHT }}>
            <div className="h-full min-h-[280px] animate-pulse rounded-lg bg-[var(--surface-elevated)]" />
          </div>
        </div>
      )}

      {domain && !isLoading && dataIssue && (
        <div className={`${CARD_CLASS} border-[var(--danger)]/30 bg-[var(--danger-soft)] p-6 text-[var(--danger)]`}>
          <h2 className="text-base font-semibold">Data issue detected</h2>
          <p className="mt-2 text-sm">
            {sanitized?.status === "error" ? sanitized.error : "Invalid or malformed trend data."}
          </p>
          <p className="mt-2 text-xs text-[var(--muted)]">
            Try another domain or date range. The app remains usable — use the links above to navigate.
          </p>
        </div>
      )}

      {domain && !isLoading && !dataIssue && trends && (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <motion.div
              key="current"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${CARD_CLASS} p-5 md:p-6`}
            >
              <p className="text-sm font-medium text-[var(--muted)]">Current visibility</p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-[var(--fg)]">
                Score: {trends.summary.currentVisibility.toFixed(1)}
              </p>
            </motion.div>
            <motion.div
              key="change"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className={`${CARD_CLASS} p-5 md:p-6`}
            >
              <p className="text-sm font-medium text-[var(--muted)]">30d change</p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-[var(--fg)]">
                {trends.summary.change30d != null ? (
                  <span
                    className={
                      trends.summary.change30d >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"
                    }
                  >
                    {trends.summary.change30d >= 0 ? "+" : ""}
                    {trends.summary.change30d.toFixed(1)} pts
                  </span>
                ) : (
                  <span className="text-[var(--muted-secondary)]">—</span>
                )}
              </p>
            </motion.div>
            <motion.div
              key="peak"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`${CARD_CLASS} p-5 md:p-6`}
            >
              <p className="text-sm font-medium text-[var(--muted)]">Peak score</p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-[var(--fg)]">
                Score: {trends.summary.peakScore.toFixed(1)}
              </p>
            </motion.div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={range}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`${CARD_CLASS} p-5 md:p-6 mb-8`}
              style={{ minHeight: CHART_MIN_HEIGHT }}
            >
              <h2 className="mb-4 text-base font-medium text-[var(--fg)] md:text-lg">
                Score trend (you vs top 2 competitors)
              </h2>
              <div className="px-2 py-2 md:px-4" style={{ minHeight: 280 }}>
                {hasChartData ? (
                  <div className="h-[280px] w-full min-h-[280px]">
                    <LineChart
                      data={chartData}
                      index="date"
                      categories={categories}
                      colors={["blue", "violet", "amber"]}
                      valueFormatter={(v) => (v != null ? `Score: ${Number(v).toFixed(1)}` : "—")}
                      showLegend={true}
                      showGridLines={true}
                      showAnimation={true}
                      curveType="natural"
                      connectNulls={true}
                      className="h-full w-full"
                    />
                  </div>
                ) : (
                  <div
                    className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface-elevated)] text-center text-sm text-[var(--muted-placeholder)]"
                    style={{ minHeight: 280 }}
                  >
                    <p>No trend data yet</p>
                    <p className="text-xs">Select a domain or widen the date range</p>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </>
      )}

      {domain && !isLoading && !trends && !dataIssue && (
        <div className={`${CARD_CLASS} p-8 text-center text-[var(--muted-secondary)]`}>
          No trend data yet. Select a domain or widen the date range.
        </div>
      )}
    </div>
  );
}

function TrendsContentWithParams() {
  const searchParams = useSearchParams();
  const domain = searchParams.get("domain") ?? undefined;
  const range = searchParams.get("range") ?? "30d";
  return (
    <TrendsErrorBoundary domain={domain} range={range}>
      <Suspense
        fallback={
          <div className="mx-auto max-w-5xl px-6 py-6">
            <div className="h-48 animate-pulse rounded-xl bg-[var(--surface-elevated)]" />
          </div>
        }
      >
        <TrendsContentInner />
      </Suspense>
    </TrendsErrorBoundary>
  );
}

export default function VisibilityTrendsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl px-6 py-6">
          <div className="h-48 animate-pulse rounded-xl bg-[var(--surface-elevated)]" />
        </div>
      }
    >
      <TrendsContentWithParams />
    </Suspense>
  );
}
