"use client";

import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { AreaChart } from "@tremor/react";

const OVERVIEW_URL = "/api/visibility-scores/overview";
const REVALIDATE_SEC = 3600; // 1 hour

type OverviewData = {
  domain: string | null;
  score: number | null;
  previousScore: number | null;
  change: number | null;
  computedAt: string | null;
  history: { date: string; score: number }[];
  domains: { domain: string; score: number }[];
};

const fetcher = async (url: string): Promise<OverviewData> => {
  const r = await fetch(url);
  const json = await r.json();
  if (!r.ok) {
    // Prefer details (e.g. DB error) so the user sees the real cause
    const msg = json?.details ?? json?.error ?? r.statusText;
    throw new Error(typeof msg === "string" ? msg : "Failed to load overview");
  }
  return json as OverviewData;
};

function formatPercent(change: number | null, previousScore: number | null): string {
  if (change == null || previousScore == null || previousScore === 0) return "—";
  const pct = (change / previousScore) * 100;
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

export default function Overview({ domain: domainProp }: { domain?: string | null }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const domainParam = domainProp ?? searchParams.get("domain");
  const url = domainParam ? `${OVERVIEW_URL}?domain=${encodeURIComponent(domainParam)}` : OVERVIEW_URL;
  const { data, error, isLoading } = useSWR<OverviewData>(url, fetcher, {
    revalidateOnFocus: false,
    revalidateIfStale: true,
    dedupingInterval: 60_000,
    refreshInterval: REVALIDATE_SEC * 1000,
  });

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-6 text-red-400">
        <p className="font-medium">Failed to load overview</p>
        <p className="mt-1 text-sm opacity-90">{error.message}</p>
        <p className="mt-3 text-xs text-red-300/80">
          Ensure <code className="rounded bg-red-900/50 px-1">DATABASE_URL</code> is set and you’ve run{" "}
          <code className="rounded bg-red-900/50 px-1">npm run db:push</code>. Run the visibility-score cron or worker to populate scores.
        </p>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="rounded-xl border border-zinc-700/50 bg-zinc-900/50 p-8">
        <div className="h-32 animate-pulse rounded bg-zinc-800" />
        <div className="mt-4 h-24 animate-pulse rounded bg-zinc-800" />
      </div>
    );
  }

  const score = data.score ?? 0;
  const change = data.change ?? null;
  const previousScore = data.previousScore ?? null;
  const percentLabel = formatPercent(change, previousScore);
  const hasTrend = change != null && previousScore != null && previousScore !== 0;
  const trendUp = hasTrend && (change ?? 0) >= 0;
  const history = data.history ?? [];
  const domains = data.domains ?? [];
  const chartData = history.length
    ? history.map((h) => ({ date: h.date, Score: h.score }))
    : [{ date: new Date().toISOString().slice(0, 10), Score: score }];

  return (
    <div className="rounded-xl border border-zinc-700/50 bg-zinc-900/50 p-6 shadow-xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wider text-zinc-400">
            Visibility Score
            {data.domain ? (
              <span className="ml-2 font-normal normal-case text-zinc-500">· {data.domain}</span>
            ) : null}
          </p>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="text-6xl font-bold tabular-nums text-white">
              {Number(score).toFixed(1)}
            </span>
            <span className="text-2xl font-medium text-zinc-500">/ 100</span>
            {hasTrend && (
              <span
                className={`rounded-md px-2 py-0.5 text-sm font-semibold tabular-nums ${
                  trendUp ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                }`}
              >
                {percentLabel}
              </span>
            )}
          </div>
        </div>
        {domains.length > 1 && (
          <select
            className="rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={data.domain ?? ""}
            onChange={(e) => {
              const next = e.target.value;
              const path = next ? `/dashboard?domain=${encodeURIComponent(next)}` : "/dashboard";
              router.push(path);
            }}
          >
            {domains.map((d) => (
              <option key={d.domain} value={d.domain}>
                {d.domain} ({d.score.toFixed(1)})
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="h-[200px]">
        <AreaChart
          data={chartData}
          index="date"
          categories={["Score"]}
          colors={["blue"]}
          valueFormatter={(v) => `${Number(v).toFixed(1)}`}
          showLegend={false}
          showGridLines={true}
          showAnimation={true}
          className="h-full w-full"
        />
      </div>
      <p className="mt-3 text-xs text-zinc-500">
        Last 30 days
        {data.computedAt ? ` · Updated ${new Date(data.computedAt).toLocaleString()}` : ""}
      </p>
    </div>
  );
}
