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
      <div className="flex h-[120px] items-center justify-center rounded-searchable-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]">
        No competitor overlap data
      </div>
    );
  }

  const maxOverlap = Math.max(
    ...competitors.map((e) => e.overlapPercent ?? 0),
    1
  );

  return (
    <div className="rounded-searchable-lg border border-[var(--border)] bg-[var(--surface)] p-4">
      <p className="mb-3 text-sm font-medium text-[var(--muted)]">
        Query overlap with competitors (shared territory)
      </p>
      <div className="space-y-2">
        {competitors.map((e) => {
          const pct = e.overlapPercent ?? 0;
          const intensity = maxOverlap > 0 ? pct / maxOverlap : 0;
          const bg = `rgba(79, 70, 229, ${0.12 + intensity * 0.4})`;
          return (
            <div
              key={e.domain}
              className="flex items-center gap-3"
              role={onSelectCompetitor ? "button" : undefined}
              onClick={() => onSelectCompetitor?.(e.domain)}
            >
              <span className="w-32 shrink-0 truncate text-sm text-[var(--fg)]" title={e.domain}>
                {e.domain}
              </span>
              <div className="h-6 flex-1 min-w-0 rounded-lg bg-[var(--surface-elevated)]">
                <div
                  className="h-full rounded-lg transition-all"
                  style={{
                    width: `${Math.min(100, pct)}%`,
                    backgroundColor: bg,
                  }}
                />
              </div>
              <span className="w-12 shrink-0 text-right text-xs tabular-nums text-[var(--muted)]">
                {pct > 0 ? `${pct}%` : "—"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
