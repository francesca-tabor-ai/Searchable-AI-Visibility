"use client";

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

export default function LeaderboardTable({
  entries,
  onSelectCompetitor,
}: {
  entries: LeaderboardEntry[];
  onSelectCompetitor?: (domain: string) => void;
}) {
  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full min-w-[400px] text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] bg-[var(--surface-elevated)]">
            <th className="px-4 py-3 font-semibold text-[var(--muted)]">Rank</th>
            <th className="px-4 py-3 font-semibold text-[var(--muted)]">Domain</th>
            <th className="px-4 py-3 font-semibold text-[var(--muted)]">Visibility Score</th>
            <th className="px-4 py-3 font-semibold text-[var(--muted)]">Citation Share</th>
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
              <td className="px-4 py-4 tabular-nums text-[var(--muted)]">{e.rank}</td>
              <td className="px-4 py-4">
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
