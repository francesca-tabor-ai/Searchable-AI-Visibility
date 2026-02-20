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
    <div className="overflow-hidden rounded-xl border border-zinc-700/50 bg-zinc-900/50">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[400px] text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-700/50 bg-zinc-800/50">
              <th className="px-4 py-3 font-semibold text-zinc-300">Rank</th>
              <th className="px-4 py-3 font-semibold text-zinc-300">Domain</th>
              <th className="px-4 py-3 font-semibold text-zinc-300">Visibility Score</th>
              <th className="px-4 py-3 font-semibold text-zinc-300">Citation Share</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr
                key={e.domain}
                className={`border-b border-zinc-700/30 transition ${
                  e.isTarget
                    ? "bg-blue-500/10 font-medium"
                    : onSelectCompetitor
                      ? "cursor-pointer hover:bg-zinc-800/70"
                      : ""
                } ${!e.isTarget && onSelectCompetitor ? "cursor-pointer" : ""}`}
                onClick={() => !e.isTarget && onSelectCompetitor?.(e.domain)}
                role={onSelectCompetitor && !e.isTarget ? "button" : undefined}
              >
                <td className="px-4 py-3 tabular-nums text-zinc-300">{e.rank}</td>
                <td className="px-4 py-3">
                  <span className={e.isTarget ? "text-blue-300" : "text-white"}>
                    {e.domain}
                  </span>
                  {e.isTarget && (
                    <span className="ml-2 text-xs text-blue-400">(you)</span>
                  )}
                </td>
                <td className="px-4 py-3 tabular-nums text-white">
                  {e.visibilityScore != null ? `${Number(e.visibilityScore).toFixed(1)}` : "—"}
                </td>
                <td className="px-4 py-3 tabular-nums text-zinc-300">
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
