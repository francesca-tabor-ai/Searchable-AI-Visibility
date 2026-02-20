"use client";

import { useMemo } from "react";
import { DonutChart } from "@tremor/react";

export type ShareEntry = { name: string; value: number };

export default function ShareOfVoiceDonut({ data }: { data: ShareEntry[] }) {
  const topShare = useMemo(() => {
    if (data.length === 0) return null;
    const max = data.reduce((acc, d) => (d.value > acc.value ? d : acc), data[0]);
    return { name: max.name, value: max.value };
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <h2 className="mb-1 text-lg font-semibold text-[var(--fg)]">Share of Voice</h2>
        <p className="text-[var(--muted-placeholder)]">No citation share data</p>
      </div>
    );
  }

  const chartData = data.map((d) => ({ name: d.name, share: d.value }));

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold text-[var(--fg)]">Share of Voice</h2>
      <div className="mb-2 flex items-baseline gap-2">
        <span className="text-3xl font-bold tabular-nums text-[var(--fg)] md:text-4xl">
          {topShare != null ? `${Number(topShare.value).toFixed(1)}%` : "—"}
        </span>
      </div>
      <p className="mb-5 text-sm text-[var(--muted-secondary)]">
        Among tracked competitors
      </p>
      <DonutChart
        data={chartData}
        index="name"
        category="share"
        valueFormatter={(v) => `${Number(v).toFixed(1)}%`}
        colors={["blue", "violet", "fuchsia", "amber", "emerald"]}
        showLabel={true}
        showAnimation={true}
        className="h-[200px]"
      />
    </div>
  );
}
