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
      <div>
        <h2 className="mb-4 text-lg font-semibold text-[var(--fg)]">Query Overlap</h2>
        <div className="flex h-[120px] items-center justify-center rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface-elevated)] text-sm text-[var(--muted-placeholder)]">
          No competitor overlap data
        </div>
      </div>
    );
  }

  const maxOverlap = Math.max(
    ...competitors.map((e) => e.overlapPercent ?? 0),
    1
  );

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-[var(--fg)]">
        Query Overlap
      </h2>
      <p className="mb-4 text-sm text-[var(--muted-secondary)]">
        Shared territory with competitors
      </p>
      <div className="space-y-4">
        {competitors.map((e) => {
          const pct = e.overlapPercent ?? 0;
          const intensity = maxOverlap > 0 ? pct / maxOverlap : 0;
          const bg = `rgba(79, 70, 229, ${0.12 + intensity * 0.4})`;
          return (
            <div
              key={e.domain}
              className="flex items-center gap-4 transition-colors duration-150"
              role={onSelectCompetitor ? "button" : undefined}
              onClick={() => onSelectCompetitor?.(e.domain)}
            >
              <span
                className="w-40 shrink-0 truncate text-sm text-[var(--fg)] md:w-48"
                title={e.domain}
              >
                {e.domain}
              </span>
              <div className="h-6 flex-1 min-w-0 rounded-lg bg-[var(--surface-elevated)] overflow-hidden">
                <div
                  className="h-full rounded-lg transition-all duration-200"
                  style={{
                    width: `${Math.min(100, pct)}%`,
                    backgroundColor: bg,
                  }}
                />
              </div>
              <span className={`w-14 shrink-0 text-right text-sm tabular-nums ${e.overlapPercent != null && e.overlapPercent > 0 ? "text-[var(--muted)]" : "text-[var(--muted-placeholder)]"}`}>
                {e.overlapPercent != null && e.overlapPercent > 0 ? `${e.overlapPercent}%` : "Not available"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
