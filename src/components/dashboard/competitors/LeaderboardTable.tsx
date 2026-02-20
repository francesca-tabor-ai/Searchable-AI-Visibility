"use client";

export type LeaderboardEntry = {
  rank: number;
  domain: string;
  visibilityScore: number | null;
  shareOfVoice: number | null;
  overlapPercent: number | null;
  isTarget: boolean;
};

export default function LeaderboardTable({
  entries,
  onSelectCompetitor,
}: {
  entries: LeaderboardEntry[];
  onSelectCompetitor?: (domain: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-searchable-lg border border-[var(--border)] bg-[var(--surface)]">
      <div className="overflow-x-auto">
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
                className={`border-b border-[var(--border)] transition ${
                  e.isTarget
                    ? "bg-[var(--accent-soft)] font-medium"
                    : onSelectCompetitor
                      ? "cursor-pointer hover:bg-[var(--surface-elevated)]"
                      : ""
                } ${!e.isTarget && onSelectCompetitor ? "cursor-pointer" : ""}`}
                onClick={() => !e.isTarget && onSelectCompetitor?.(e.domain)}
                role={onSelectCompetitor && !e.isTarget ? "button" : undefined}
              >
                <td className="px-4 py-3 tabular-nums text-[var(--muted)]">{e.rank}</td>
                <td className="px-4 py-3">
                  <span className={e.isTarget ? "text-[var(--accent)]" : "text-[var(--fg)]"}>
                    {e.domain}
                  </span>
                  {e.isTarget && (
                    <span className="ml-2 text-xs text-[var(--accent)]">(you)</span>
                  )}
                </td>
                <td className="px-4 py-3 tabular-nums text-[var(--fg)] font-medium">
                  {e.visibilityScore != null ? `${Number(e.visibilityScore).toFixed(1)}` : "—"}
                </td>
                <td className="px-4 py-3 tabular-nums text-[var(--muted)]">
                  {e.shareOfVoice != null ? `${e.shareOfVoice}%` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
