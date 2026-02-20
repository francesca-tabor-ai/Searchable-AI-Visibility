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
      <div className="rounded-xl border border-[var(--danger)]/30 bg-[var(--danger-soft)] p-6 text-[var(--danger)] shadow-sm transition-opacity duration-200">
        <p className="font-medium">Failed to load overview</p>
        <p className="mt-1 text-sm opacity-90">{error.message}</p>
        <p className="mt-3 text-xs opacity-80">
          Ensure <code className="rounded bg-[var(--danger-soft)] px-1">DATABASE_URL</code> is set and you&apos;ve run{" "}
          <code className="rounded bg-[var(--danger-soft)] px-1">npm run db:push</code>. Run the visibility-score cron or worker to populate scores.
        </p>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm md:p-8">
          <div className="h-32 animate-pulse rounded-lg bg-[var(--surface-elevated)]" />
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm md:p-8">
          <div className="h-48 animate-pulse rounded-lg bg-[var(--surface-elevated)]" />
        </div>
      </div>
    );
  }

  const score = data.score ?? null;
  const change = data.change ?? null;
  const previousScore = data.previousScore ?? null;
  const percentLabel = formatPercent(change, previousScore);
  const hasTrend = change != null && previousScore != null && previousScore !== 0;
  const trendUp = hasTrend && (change ?? 0) >= 0;
  const history = data.history ?? [];
  const domains = data.domains ?? [];
  const hasRealScore = score != null && (data.computedAt != null || history.length > 0);
  const chartData =
    history.length > 0
      ? history.map((h) => ({ date: h.date, Score: h.score }))
      : [];

  return (
    <div className="grid gap-6 lg:gap-8">
      {/* Visibility Score card */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm transition-shadow duration-200 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-base font-medium text-[var(--muted)]">
              Visibility Score
            </p>
            {data.domain ? (
              <p className="mt-0.5 text-sm text-[var(--muted-secondary)]">
                {data.domain}
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap items-baseline gap-3">
              <span className="text-7xl font-bold tabular-nums text-[var(--fg)] md:text-8xl">
                {hasRealScore ? Number(score).toFixed(1) : "—"}
              </span>
              {hasRealScore && (
                <span className="text-xl font-medium text-[var(--muted)]">/ 100</span>
              )}
              {hasTrend && (
                <span
                  className={`rounded-lg px-2.5 py-1 text-sm font-semibold tabular-nums transition-colors duration-200 ${
                    trendUp
                      ? "bg-[var(--success-soft)] text-[var(--success)]"
                      : "bg-[var(--danger-soft)] text-[var(--danger)]"
                  }`}
                >
                  {percentLabel}
                </span>
              )}
            </div>
          </div>
          {domains.length > 1 && (
            <div className="flex items-center">
              <select
                className="h-10 min-h-[40px] min-w-[180px] rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-2 text-sm text-[var(--fg)] transition-[border-color,box-shadow] duration-200 focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-1"
                value={data.domain ?? ""}
                onChange={(e) => {
                  const next = e.target.value;
                  router.push(next ? `/dashboard?domain=${encodeURIComponent(next)}` : "/dashboard");
                }}
              >
                {domains.map((d) => (
                  <option key={d.domain} value={d.domain}>
                    {d.domain} ({d.score.toFixed(1)})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Chart card */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm transition-shadow duration-200 md:p-8">
        <h2 className="text-lg font-medium text-[var(--fg)]">Score over time</h2>
        <p className="mt-1 text-sm text-[var(--muted-secondary)]">
          Last 30 days
          {data.computedAt ? ` · Updated ${new Date(data.computedAt).toLocaleString()}` : ""}
        </p>
        <div className="mt-6 min-h-[200px] px-1">
          {chartData.length > 0 ? (
            <div className="h-[220px] w-full">
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
          ) : (
            <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed border-[var(--border)] bg-[var(--bg)] text-sm text-[var(--muted)]">
              No history yet. Scores will appear here once computed.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
