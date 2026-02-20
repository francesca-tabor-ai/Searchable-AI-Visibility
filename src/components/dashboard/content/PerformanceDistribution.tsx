"use client";

import { useMemo } from "react";
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceDot,
  Area,
} from "recharts";

export type PageForDistribution = { citationCount: number };

const CHART_HEIGHT = 300;
const PAGE_PCT_TICKS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
const REFERENCE_PCTS = [10, 30, 50, 70, 100];

/**
 * Builds Lorenz/concentration curve: for each cumulative share of pages (x),
 * cumulative share of citations (y). Sorted by citation count descending.
 */
function computeLorenzCurve(
  pages: PageForDistribution[]
): { pagePct: number; citationPct: number }[] {
  if (pages.length === 0) return [];
  const sorted = [...pages].sort((a, b) => b.citationCount - a.citationCount);
  const totalCitations = sorted.reduce((s, p) => s + p.citationCount, 0);
  if (totalCitations === 0) return [];

  const n = sorted.length;
  const curve: { pagePct: number; citationPct: number }[] = [{ pagePct: 0, citationPct: 0 }];

  for (const pct of PAGE_PCT_TICKS) {
    if (pct === 0) continue;
    const pageCount = Math.ceil((pct / 100) * n) || 0;
    const cumulativeCitations = sorted
      .slice(0, pageCount)
      .reduce((s, p) => s + p.citationCount, 0);
    const citationPct = (cumulativeCitations / totalCitations) * 100;
    curve.push({ pagePct: pct, citationPct: Math.round(citationPct * 10) / 10 });
  }

  // Ensure (100, 100)
  if (curve[curve.length - 1]?.pagePct !== 100) {
    curve.push({ pagePct: 100, citationPct: 100 });
  } else {
    curve[curve.length - 1] = { pagePct: 100, citationPct: 100 };
  }
  return curve;
}

/** Top 10% insight: "Top 10% of pages capture X% of citations." */
function getInsight(pages: PageForDistribution[]): string | null {
  if (pages.length === 0) return null;
  const sorted = [...pages].sort((a, b) => b.citationCount - a.citationCount);
  const total = sorted.reduce((s, p) => s + p.citationCount, 0);
  if (total === 0) return null;
  const top10Count = Math.ceil(pages.length * 0.1) || 0;
  const top10Citations = sorted.slice(0, top10Count).reduce((s, p) => s + p.citationCount, 0);
  const citationPct = (top10Citations / total) * 100;
  const pagePct = 10;
  return `Top ${pagePct}% of pages capture ${Math.round(citationPct * 10) / 10}% of citations.`;
}

/** Citation % at the 10% page mark (for highlight dot). */
function getCitationPctAt10(curve: { pagePct: number; citationPct: number }[]): number | null {
  const at10 = curve.find((p) => p.pagePct === 10);
  return at10?.citationPct ?? curve.find((p) => p.pagePct >= 10)?.citationPct ?? null;
}

export default function PerformanceDistribution({
  pages,
  isLoading,
}: {
  pages: PageForDistribution[];
  isLoading?: boolean;
}) {
  const { chartData, insight, citationPctAt10, pageCount, totalCitations } = useMemo(() => {
    const curvePoints = computeLorenzCurve(pages);
    const total = pages.reduce((s, p) => s + p.citationCount, 0);
    const pageCount = pages.length;
    // Merge with equality line (y = x)
    const chartData = curvePoints.map((p) => ({
      ...p,
      equality: p.pagePct,
    }));
    const insight = getInsight(pages);
    const citationPctAt10 = getCitationPctAt10(curvePoints);
    return {
      chartData,
      insight,
      citationPctAt10,
      pageCount,
      totalCitations: total,
    };
  }, [pages]);

  const hasData =
    pages.length > 0 && totalCitations > 0 && chartData.length > 0;
  const smallDataset = pageCount < 5 && hasData;
  const singlePage = pageCount === 1 && hasData;

  // Skeleton
  if (isLoading) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm overflow-hidden">
        <div className="border-b border-[var(--border)] px-5 py-4 md:px-6">
          <div className="h-5 w-48 animate-pulse rounded bg-[var(--surface-elevated)]" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-[var(--surface-elevated)]" />
          <div className="mt-3 flex justify-end">
            <div className="h-7 w-24 animate-pulse rounded-full bg-[var(--surface-elevated)]" />
          </div>
        </div>
        <div className="p-4 md:p-6" style={{ height: CHART_HEIGHT + 32 }}>
          <div className="h-full w-full animate-pulse rounded-lg bg-[var(--surface-elevated)]" />
        </div>
        <div className="border-t border-[var(--border)] px-5 py-3 md:px-6">
          <div className="h-4 w-64 animate-pulse rounded bg-[var(--surface-elevated)]" />
        </div>
      </div>
    );
  }

  // Empty state
  if (!hasData) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm overflow-hidden">
        <div className="border-b border-[var(--border)] px-5 py-4 md:px-6">
          <h2 className="text-base font-semibold text-[var(--fg)] md:text-lg">
            Citation Concentration
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Share of citations captured by top X% of pages (last 30 days)
          </p>
          <div className="mt-3 flex justify-end">
            <span className="rounded-full border border-[var(--border)] bg-[var(--bg)] px-3 py-1 text-xs font-medium text-[var(--muted)]">
              Last 30 days
            </span>
          </div>
        </div>
        <div
          className="flex flex-col items-center justify-center gap-2 border-t border-[var(--border)] px-4 py-12 text-center text-sm text-[var(--muted-placeholder)]"
          style={{ minHeight: CHART_HEIGHT }}
        >
          <p>No citations detected in the selected range.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm overflow-hidden">
      {/* Card header */}
      <div className="border-b border-[var(--border)] px-5 py-4 md:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-[var(--fg)] md:text-lg">
              Citation Concentration
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Share of citations captured by top X% of pages (last 30 days)
            </p>
          </div>
          <span className="rounded-full border border-[var(--border)] bg-[var(--bg)] px-3 py-1 text-xs font-medium text-[var(--muted)] whitespace-nowrap">
            Last 30 days
          </span>
        </div>
      </div>

      {/* Small dataset note */}
      {smallDataset && (
        <div className="border-b border-[var(--border)] bg-[var(--surface-elevated)] px-5 py-2.5 md:px-6">
          <p className="text-xs text-[var(--muted)]">
            Concentration is less meaningful with fewer than 5 pages.
          </p>
        </div>
      )}

      {/* Optional single-page metric card */}
      {singlePage && (
        <div className="border-b border-[var(--border)] px-5 py-3 md:px-6">
          <p className="text-sm font-medium text-[var(--fg)]">
            1 page accounts for 100% of citations.
          </p>
        </div>
      )}

      {/* Chart body */}
      <div className="px-4 py-4 md:px-6 md:py-5" style={{ minHeight: CHART_HEIGHT }}>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 12, right: 16, left: 8, bottom: 8 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                vertical={false}
              />
              <XAxis
                type="number"
                dataKey="pagePct"
                domain={[0, 100]}
                ticks={[0, 20, 40, 60, 80, 100]}
                tickFormatter={(v) => `${v}%`}
                tick={{ fill: "var(--muted)", fontSize: 12 }}
                axisLine={{ stroke: "var(--border)" }}
                tickLine={{ stroke: "var(--border)" }}
              />
              <YAxis
                type="number"
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tickFormatter={(v) => `${v}%`}
                tick={{ fill: "var(--muted)", fontSize: 12 }}
                axisLine={{ stroke: "var(--border)" }}
                tickLine={{ stroke: "var(--border)" }}
                width={36}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length || !payload[0]) return null;
                  const d = payload[0].payload as { pagePct: number; citationPct: number };
                  return (
                    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 shadow-lg text-left">
                      <p className="text-xs font-medium text-[var(--fg)]">
                        Top {d.pagePct}% pages
                      </p>
                      <p className="text-xs text-[var(--muted)]">
                        Capture {d.citationPct}% of citations
                      </p>
                      <p className="text-xs text-[var(--muted)]">
                        Pages counted: {pageCount}
                      </p>
                    </div>
                  );
                }}
                cursor={{ stroke: "var(--border)", strokeDasharray: "3 3" }}
              />
              <Legend
                wrapperStyle={{ paddingTop: 8 }}
                formatter={(value) => (
                  <span className="text-sm text-[var(--muted)]">{value}</span>
                )}
              />
              {/* Equality baseline (45° line) */}
              <Line
                type="monotone"
                dataKey="equality"
                stroke="var(--muted-soft)"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                name="Even distribution"
                connectNulls
              />
              {/* Actual concentration curve: optional area under curve */}
              <Area
                type="monotone"
                dataKey="citationPct"
                fill="var(--accent-soft)"
                fillOpacity={0.4}
                stroke="none"
              />
              <Line
                type="monotone"
                dataKey="citationPct"
                stroke="var(--accent)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "var(--accent)", stroke: "var(--bg)", strokeWidth: 2 }}
                name="Your pages"
                connectNulls
              />
              {/* Vertical reference lines */}
              {REFERENCE_PCTS.map((x) => (
                <ReferenceLine
                  key={x}
                  x={x}
                  stroke="var(--border)"
                  strokeDasharray="2 2"
                  strokeOpacity={0.8}
                />
              ))}
              {/* Highlight dot at Top 10% */}
              {citationPctAt10 != null && (
                <ReferenceDot
                  x={10}
                  y={citationPctAt10}
                  r={6}
                  fill="var(--accent)"
                  stroke="var(--bg)"
                  strokeWidth={2}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Card footer: 1-sentence insight */}
      {insight && (
        <div className="border-t border-[var(--border)] px-5 py-3 md:px-6 bg-[var(--surface-elevated)]">
          <p className="text-sm text-[var(--fg)]">
            {insight}
          </p>
        </div>
      )}
    </div>
  );
}
