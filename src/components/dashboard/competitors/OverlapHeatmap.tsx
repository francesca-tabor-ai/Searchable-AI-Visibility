"use client";

export type OverlapEntry = { domain: string; overlapPercent: number | null };

export default function OverlapHeatmap({
  targetDomain,
  entries,
  onSelectCompetitor,
}: {
  targetDomain: string;
  entries: OverlapEntry[];
  onSelectCompetitor?: (domain: string) => void;
}) {
  const competitors = entries.filter((e) => e.domain !== targetDomain);
  if (competitors.length === 0) {
    return (
      <div className="flex h-[120px] items-center justify-center rounded-xl border border-zinc-700/50 bg-zinc-900/50 text-zinc-500">
        No competitor overlap data
      </div>
    );
  }

  const maxOverlap = Math.max(
    ...competitors.map((e) => e.overlapPercent ?? 0),
    1
  );

  return (
    <div className="rounded-xl border border-zinc-700/50 bg-zinc-900/50 p-4">
      <p className="mb-3 text-sm font-medium text-zinc-400">
        Query overlap with competitors (shared territory)
      </p>
      <div className="space-y-2">
        {competitors.map((e) => {
          const pct = e.overlapPercent ?? 0;
          const intensity = maxOverlap > 0 ? pct / maxOverlap : 0;
          const bg = `rgba(59, 130, 246, ${0.15 + intensity * 0.5})`;
          return (
            <div
              key={e.domain}
              className="flex items-center gap-3"
              role={onSelectCompetitor ? "button" : undefined}
              onClick={() => onSelectCompetitor?.(e.domain)}
            >
              <span className="w-32 shrink-0 truncate text-sm text-zinc-300" title={e.domain}>
                {e.domain}
              </span>
              <div className="h-6 flex-1 min-w-0 rounded bg-zinc-800">
                <div
                  className="h-full rounded transition-all"
                  style={{
                    width: `${Math.min(100, pct)}%`,
                    backgroundColor: bg,
                  }}
                />
              </div>
              <span className="w-12 shrink-0 text-right text-xs tabular-nums text-zinc-400">
                {pct > 0 ? `${pct}%` : "—"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
