"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, Suspense } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import { LineChart } from "@tremor/react";

const OVERVIEW_URL = "/api/visibility-scores/overview";
const TRENDS_URL = (d: string, range: string) =>
  `/api/trends?domain=${encodeURIComponent(d)}&range=${range}`;

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type OverviewData = {
  domain: string | null;
  domains: { domain: string; score: number }[];
};

type TrendsData = {
  domain: string;
  range: string;
  summary: {
    currentVisibility: number;
    change30d: number | null;
    peakScore: number;
  };
  domains: {
    target: string;
    competitor1: string | null;
    competitor2: string | null;
  };
  series: {
    date: string;
    score: number | null;
    scoreCompetitor1: number | null;
    scoreCompetitor2: number | null;
    citationCount: number;
  }[];
};

const RANGES = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
] as const;

function TrendsContent() {
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
  const { data: trends, error, isLoading } = useSWR<TrendsData>(trendsUrl, fetcher);

  const chartData = useMemo(() => {
    if (!trends?.series?.length) return [];
    const targetLabel = "You";
    const c1 = trends.domains.competitor1 ? "Competitor 1" : null;
    const c2 = trends.domains.competitor2 ? "Competitor 2" : null;
    return trends.series.map((s) => {
      const row: Record<string, string | number | null> = {
        date: s.date,
        [targetLabel]: s.score != null ? Math.round(s.score * 10) / 10 : null,
      };
      if (c1) row[c1] = s.scoreCompetitor1 != null ? Math.round(s.scoreCompetitor1 * 10) / 10 : null;
      if (c2) row[c2] = s.scoreCompetitor2 != null ? Math.round(s.scoreCompetitor2 * 10) / 10 : null;
      return row;
    });
  }, [trends]);

  const categories = useMemo(() => {
    const c: string[] = ["You"];
    if (trends?.domains.competitor1) c.push("Competitor 1");
    if (trends?.domains.competitor2) c.push("Competitor 2");
    return c;
  }, [trends]);

  return (
    <main className="p-6 md:p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Visibility Trends
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Score over time vs top competitors · 7-day rolling average
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
                  ? `/dashboard/trends?domain=${encodeURIComponent(next)}`
                  : "/dashboard/trends"
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
          No domains with visibility data.
        </div>
      )}

      {domain && isLoading && (
        <div className="rounded-xl border border-zinc-700/50 bg-zinc-900/50 p-8">
          <div className="h-64 animate-pulse rounded bg-zinc-800" />
        </div>
      )}

      {domain && error && (
        <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-6 text-red-400">
          Failed to load trends. {(error as Error).message}
        </div>
      )}

      {domain && trends && !isLoading && (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <motion.div
              key="current"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-zinc-700/50 bg-zinc-900/50 p-4"
            >
              <p className="text-sm font-medium text-zinc-400">Current Visibility</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-white">
                {trends.summary.currentVisibility.toFixed(1)}
              </p>
            </motion.div>
            <motion.div
              key="change"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="rounded-xl border border-zinc-700/50 bg-zinc-900/50 p-4"
            >
              <p className="text-sm font-medium text-zinc-400">30d Change</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-white">
                {trends.summary.change30d != null ? (
                  <span
                    className={
                      trends.summary.change30d >= 0 ? "text-emerald-400" : "text-red-400"
                    }
                  >
                    {trends.summary.change30d >= 0 ? "+" : ""}
                    {trends.summary.change30d.toFixed(1)}
                  </span>
                ) : (
                  <span className="text-zinc-500">-</span>
                )}
              </p>
            </motion.div>
            <motion.div
              key="peak"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl border border-zinc-700/50 bg-zinc-900/50 p-4"
            >
              <p className="text-sm font-medium text-zinc-400">Peak Score</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-white">
                {trends.summary.peakScore.toFixed(1)}
              </p>
            </motion.div>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {RANGES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRange(r.value)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  range === r.value
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={range}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="rounded-xl border border-zinc-700/50 bg-zinc-900/50 p-4"
            >
              <p className="mb-3 text-sm font-medium text-zinc-400">
                Score trend (you vs top 2 competitors)
              </p>
              <div className="h-[280px] w-full min-h-[200px]">
                {chartData.length > 0 && categories.length > 0 ? (
                  <LineChart
                    data={chartData}
                    index="date"
                    categories={categories}
                    colors={["blue", "violet", "amber"]}
                    valueFormatter={(v) => (v != null ? String(Number(v).toFixed(1)) : "-")}
                    showLegend={true}
                    showGridLines={true}
                    showAnimation={true}
                    curveType="natural"
                    connectNulls={true}
                    className="h-full w-full"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-zinc-500">
                    No trend data for this range.
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </>
      )}
    </main>
  );
}

export default function VisibilityTrendsPage() {
  return (
    <Suspense
      fallback={
        <main className="p-6 md:p-8">
          <div className="h-48 animate-pulse rounded-xl bg-zinc-800/50" />
        </main>
      }
    >
      <TrendsContent />
    </Suspense>
  );
}
