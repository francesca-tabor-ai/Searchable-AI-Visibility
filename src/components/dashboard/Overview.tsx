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
      <div className="rounded-searchable-lg border border-[var(--danger)]/30 bg-[var(--danger-soft)] p-6 text-[var(--danger)]">
        <p className="font-medium">Failed to load overview</p>
        <p className="mt-1 text-sm opacity-90">{error.message}</p>
        <p className="mt-3 text-xs opacity-80">
          Ensure <code className="rounded bg-[var(--danger-soft)] px-1">DATABASE_URL</code> is set and you've run{" "}
          <code className="rounded bg-[var(--danger-soft)] px-1">npm run db:push</code>. Run the visibility-score cron or worker to populate scores.
        </p>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="rounded-searchable-lg border border-[var(--border)] bg-[var(--surface)] p-8">
        <div className="h-32 animate-pulse rounded-lg bg-[var(--surface-elevated)]" />
        <div className="mt-4 h-24 animate-pulse rounded-lg bg-[var(--surface-elevated)]" />
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
    <div className="rounded-searchable-lg border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wider text-[var(--muted)]">
            Visibility Score
            {data.domain ? (
              <span className="ml-2 font-normal normal-case text-[var(--muted-soft)]">· {data.domain}</span>
            ) : null}
          </p>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="text-6xl font-bold tabular-nums text-[var(--fg)]">
              {Number(score).toFixed(1)}
            </span>
            <span className="text-2xl font-medium text-[var(--muted)]">/ 100</span>
            {hasTrend && (
              <span
                className={`rounded-lg px-2 py-0.5 text-sm font-semibold tabular-nums ${
                  trendUp ? "bg-[var(--success-soft)] text-[var(--success)]" : "bg-[var(--danger-soft)] text-[var(--danger)]"
                }`}
              >
                {percentLabel}
              </span>
            )}
          </div>
        </div>
        {domains.length > 1 && (
          <select
            className="rounded-searchable border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--fg)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
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
      <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
        Last 30 days
        {data.computedAt ? ` · Updated ${new Date(data.computedAt).toLocaleString()}` : ""}
      </p>
    </div>
  );
}
