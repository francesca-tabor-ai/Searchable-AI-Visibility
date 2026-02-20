"use client";

export type SortKey = "rank" | "domain" | "visibilityScore" | "citationShare";
export type SortDir = "asc" | "desc";

export type LeaderboardEntry = {
  rank: number;
  domain: string;
  visibilityScore: number | null;
  shareOfVoice: number | null;
  overlapPercent: number | null;
  isTarget: boolean;
};

const EMPTY_LABEL = "Not available";

function formatScore(value: number | null): string {
  if (value == null) return EMPTY_LABEL;
  return Number(value).toFixed(1);
}

function formatShare(value: number | null): string {
  if (value == null) return EMPTY_LABEL;
  return `${value}%`;
}

function SortIcon({ column, sortBy, sortDir }: { column: SortKey; sortBy: SortKey; sortDir: SortDir }) {
  if (sortBy !== column) return <span className="text-[var(--muted-placeholder)] opacity-50">↕</span>;
  return sortDir === "asc" ? <span className="text-[var(--muted)]">▲</span> : <span className="text-[var(--muted)]">▼</span>;
}

function cycleSort(currentSort: SortKey, currentDir: SortDir, column: SortKey): { sortBy: SortKey; sortDir: SortDir } {
  if (currentSort !== column) return { sortBy: column, sortDir: "desc" };
  if (currentDir === "desc") return { sortBy: column, sortDir: "asc" };
  return { sortBy: "rank", sortDir: "asc" };
}

export default function LeaderboardTable({
  entries,
  onSelectCompetitor,
  sortBy = "rank",
  sortDir = "asc",
  onSortChange,
}: {
  entries: LeaderboardEntry[];
  onSelectCompetitor?: (domain: string) => void;
  sortBy?: SortKey;
  sortDir?: SortDir;
  onSortChange?: (key: SortKey, dir: SortDir) => void;
}) {
  const handleHeaderClick = (column: SortKey) => {
    if (!onSortChange) return;
    const next = cycleSort(sortBy, sortDir, column);
    onSortChange(next.sortBy, next.sortDir);
  };

  return (
    <div className="overflow-x-auto -mx-1 max-h-[min(70vh,600px)] overflow-y-auto flex flex-col">
      <table className="w-full min-w-[400px] text-left text-sm border-collapse">
        <thead className="sticky top-0 z-10 bg-[var(--surface-elevated)] shadow-[0_1px_0_0_var(--border)]">
          <tr className="border-b border-[var(--border)]">
            <th
              className="sticky left-0 z-20 bg-[var(--surface-elevated)] px-4 py-3 font-semibold text-[var(--muted)] cursor-pointer select-none hover:text-[var(--fg)]"
              onClick={() => onSortChange && handleHeaderClick("rank")}
              role={onSortChange ? "button" : undefined}
            >
              <span className="inline-flex items-center gap-1">
                Rank
                {onSortChange && <SortIcon column="rank" sortBy={sortBy} sortDir={sortDir} />}
              </span>
            </th>
            <th
              className="sticky left-0 z-20 bg-[var(--surface-elevated)] px-4 py-3 font-semibold text-[var(--muted)] cursor-pointer select-none hover:text-[var(--fg)] min-w-[140px]"
              onClick={() => onSortChange && handleHeaderClick("domain")}
              role={onSortChange ? "button" : undefined}
            >
              <span className="inline-flex items-center gap-1">
                Domain
                {onSortChange && <SortIcon column="domain" sortBy={sortBy} sortDir={sortDir} />}
              </span>
            </th>
            <th
              className="px-4 py-3 font-semibold text-[var(--muted)] cursor-pointer select-none hover:text-[var(--fg)]"
              onClick={() => onSortChange && handleHeaderClick("visibilityScore")}
              role={onSortChange ? "button" : undefined}
            >
              <span className="inline-flex items-center gap-1">
                Visibility Score
                {onSortChange && <SortIcon column="visibilityScore" sortBy={sortBy} sortDir={sortDir} />}
              </span>
            </th>
            <th
              className="px-4 py-3 font-semibold text-[var(--muted)] cursor-pointer select-none hover:text-[var(--fg)]"
              onClick={() => onSortChange && handleHeaderClick("citationShare")}
              role={onSortChange ? "button" : undefined}
            >
              <span className="inline-flex items-center gap-1">
                Citation Share
                {onSortChange && <SortIcon column="citationShare" sortBy={sortBy} sortDir={sortDir} />}
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr
              key={e.domain}
              className={`
                border-b border-[var(--border)] transition-colors duration-150
                ${e.isTarget
                  ? "bg-[var(--accent-soft)] font-medium"
                  : onSelectCompetitor
                    ? "cursor-pointer hover:bg-[var(--surface-elevated)]"
                    : ""
                }
              `}
              style={{ minHeight: "48px" }}
              onClick={() => !e.isTarget && onSelectCompetitor?.(e.domain)}
              role={onSelectCompetitor && !e.isTarget ? "button" : undefined}
            >
              <td className="sticky left-0 z-[1] bg-inherit px-4 py-4 tabular-nums text-[var(--muted)]">
                {e.rank}
              </td>
              <td className="sticky left-0 z-[1] bg-inherit px-4 py-4 min-w-[140px]">
                <span className="flex items-center gap-2">
                  <span className={e.isTarget ? "text-[var(--accent)] font-semibold" : "text-[var(--fg)]"}>
                    {e.domain}
                  </span>
                  {e.isTarget && (
                    <span className="inline-flex items-center rounded-md bg-[var(--accent)]/20 px-2 py-0.5 text-xs font-medium text-[var(--accent)]">
                      You
                    </span>
                  )}
                </span>
              </td>
              <td className="px-4 py-4 tabular-nums font-medium">
                {e.visibilityScore != null ? (
                  <span className="text-[var(--fg)]">{formatScore(e.visibilityScore)}</span>
                ) : (
                  <span className="text-[var(--muted-placeholder)]">{EMPTY_LABEL}</span>
                )}
              </td>
              <td className="px-4 py-4 tabular-nums">
                {e.shareOfVoice != null ? (
                  <span className="text-[var(--muted)]">{formatShare(e.shareOfVoice)}</span>
                ) : (
                  <span className="text-[var(--muted-placeholder)]">{EMPTY_LABEL}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
