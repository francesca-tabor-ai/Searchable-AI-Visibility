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
    return Array.from({ length: DECILES }, (_, i) => ({
      bucket: `Top ${(i + 1) * 10}%`,
      "Citation share (%)": 0,
    }));
  }

  const sorted = [...pages].sort((a, b) => b.citationCount - a.citationCount);
  const totalCitations = sorted.reduce((s, p) => s + p.citationCount, 0);
  if (totalCitations === 0) {
    return Array.from({ length: DECILES }, (_, i) => ({
      bucket: `Top ${(i + 1) * 10}%`,
      "Citation share (%)": 0,
    }));
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

  return (
    <div className="rounded-searchable-lg border border-[var(--border)] bg-[var(--surface)] p-4">
      <p className="mb-2 text-sm font-medium text-[var(--muted)]">Concentration</p>
      {summary != null && (
        <p className="mb-4 text-sm text-[var(--fg)] leading-relaxed">
          <span className="font-semibold text-[var(--fg)]">{summary.pagePct}%</span> of your pages
          drive <span className="font-semibold text-[var(--fg)]">{summary.citationPct}%</span> of AI
          citations.
        </p>
      )}
      <div className="h-[220px]">
        <BarChart
          data={chartData}
          index="bucket"
          categories={["Citation share (%)"]}
          colors={["blue"]}
          valueFormatter={(v) => `${Number(v).toFixed(1)}%`}
          showLegend={false}
          showGridLines={true}
          showAnimation={true}
          layout="vertical"
          className="h-full w-full"
        />
      </div>
    </div>
  );
}
