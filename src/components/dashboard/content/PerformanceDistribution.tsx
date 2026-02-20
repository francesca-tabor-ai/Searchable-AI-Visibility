"use client";

import { useMemo } from "react";
import { BarChart } from "@tremor/react";

export type PageForDistribution = { citationCount: number };

const DECILES = 10; // 10% buckets

/**
 * Computes concentration: "X% of pages drive Y% of citations" (Pareto-style).
 * Returns one row per decile: Top 10%, Top 20%, ... 100%.
 */
function computeConcentration(pages: PageForDistribution[]): { bucket: string; "Citation share (%)": number }[] {
  if (pages.length === 0) {
    return [];
  }

  const sorted = [...pages].sort((a, b) => b.citationCount - a.citationCount);
  const totalCitations = sorted.reduce((s, p) => s + p.citationCount, 0);
  if (totalCitations === 0) {
    return [];
  }

  const n = sorted.length;
  const result: { bucket: string; "Citation share (%)": number }[] = [];

  for (let d = 1; d <= DECILES; d++) {
    const pageCount = Math.ceil((d / DECILES) * n) || 0;
    const cumulativeCitations = sorted
      .slice(0, pageCount)
      .reduce((s, p) => s + p.citationCount, 0);
    const pct = totalCitations > 0 ? (cumulativeCitations / totalCitations) * 100 : 0;
    result.push({
      bucket: `Top ${d * 10}%`,
      "Citation share (%)": Math.round(pct * 10) / 10,
    });
  }

  return result;
}

export default function PerformanceDistribution({
  pages,
}: {
  pages: PageForDistribution[];
}) {
  const chartData = useMemo(() => computeConcentration(pages), [pages]);

  const summary = useMemo(() => {
    if (pages.length === 0) return null;
    const sorted = [...pages].sort((a, b) => b.citationCount - a.citationCount);
    const total = sorted.reduce((s, p) => s + p.citationCount, 0);
    const top10Count = Math.ceil(pages.length * 0.1) || 0;
    const top10Citations = sorted.slice(0, top10Count).reduce((s, p) => s + p.citationCount, 0);
    const top10Pct = total > 0 ? (top10Citations / total) * 100 : 0;
    return {
      pagePct: 10,
      citationPct: Math.round(top10Pct * 10) / 10,
    };
  }, [pages]);

  const hasData = chartData.length > 0 && pages.length > 0 && pages.some((p) => p.citationCount > 0);

  return (
    <div>
      <h2 className="mb-3 text-base font-medium text-[var(--fg)] md:text-lg">
        Citation Concentration
      </h2>
      {summary != null && hasData && (
        <p className="mb-2 text-sm leading-relaxed text-[var(--fg)] md:text-base">
          <span className="font-semibold text-[var(--fg)]">{summary.pagePct}%</span> of your pages
          drive <span className="font-semibold text-[var(--fg)]">{summary.citationPct}%</span> of AI
          citations.
        </p>
      )}
      <p className="mb-4 text-xs text-[var(--muted-secondary)]">
        Based on last 30 days
      </p>

      {!hasData ? (
        <div className="flex h-[260px] items-center justify-center rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface-elevated)] text-sm text-[var(--muted-placeholder)]">
          No distribution data yet
        </div>
      ) : (
        <div className="h-[260px] px-4 py-2 md:px-6">
          <BarChart
            data={chartData}
            index="bucket"
            categories={["Citation share (%)"]}
            colors={["blue"]}
            valueFormatter={(v) => `${Math.round(Number(v))}%`}
            showLegend={false}
            showGridLines={true}
            showAnimation={true}
            layout="vertical"
            className="h-full w-full"
          />
        </div>
      )}
    </div>
  );
}
