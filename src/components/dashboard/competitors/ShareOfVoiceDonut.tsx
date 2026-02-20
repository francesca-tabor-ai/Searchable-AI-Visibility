"use client";

import { DonutChart } from "@tremor/react";

export type ShareEntry = { name: string; value: number };

export default function ShareOfVoiceDonut({ data }: { data: ShareEntry[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-[240px] items-center justify-center rounded-xl border border-zinc-700/50 bg-zinc-900/50 text-zinc-500">
        No citation share data
      </div>
    );
  }

  const chartData = data.map((d) => ({ name: d.name, share: d.value }));

  return (
    <div className="rounded-xl border border-zinc-700/50 bg-zinc-900/50 p-4">
      <p className="mb-3 text-sm font-medium text-zinc-400">Share of voice (top competitors)</p>
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
