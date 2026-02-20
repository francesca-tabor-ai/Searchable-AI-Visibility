"use client";

export type QueryRow = {
  queryId: string;
  queryText: string;
  targetRank: number;
  competitorRank: number;
  targetCitations: number;
  competitorCitations: number;
  winner: "target" | "competitor" | "tie";
};

export default function QueriesDrillDown({
  targetDomain,
  competitorDomain,
  queries,
  onClose,
}: {
  targetDomain: string;
  competitorDomain: string;
  queries: QueryRow[];
  onClose: () => void;
}) {
  const competitorWins = queries.filter((q) => q.winner === "competitor");
  const youWins = queries.filter((q) => q.winner === "target");
  const ties = queries.filter((q) => q.winner === "tie");

  return (
    <div className="rounded-xl border border-zinc-700/50 bg-zinc-900/80 shadow-xl">
      <div className="flex items-center justify-between border-b border-zinc-700/50 px-4 py-3">
        <h3 className="font-semibold text-white">
          Shared queries: you vs {competitorDomain}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-zinc-400 hover:bg-zinc-700 hover:text-white"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
      <div className="max-h-[60vh] overflow-y-auto p-4">
        {competitorWins.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-amber-400">
              Queries {competitorDomain} is winning ({competitorWins.length})
            </p>
            <ul className="space-y-2">
              {competitorWins.map((q) => (
                <li
                  key={q.queryId}
                  className="rounded-lg border border-amber-500/20 bg-amber-950/20 p-3 text-sm"
                >
                  <p className="text-zinc-200">{q.queryText || "(no text)"}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    You: rank #{q.targetRank} ({q.targetCitations} citations) ·{" "}
                    {competitorDomain}: rank #{q.competitorRank} ({q.competitorCitations}{" "}
                    citations)
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
        {youWins.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-emerald-400">
              Queries you’re winning ({youWins.length})
            </p>
            <ul className="space-y-2">
              {youWins.map((q) => (
                <li
                  key={q.queryId}
                  className="rounded-lg border border-emerald-500/20 bg-emerald-950/20 p-3 text-sm"
                >
                  <p className="text-zinc-200">{q.queryText || "(no text)"}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    You: rank #{q.targetRank} ({q.targetCitations}) · {competitorDomain}: #
                    {q.competitorRank} ({q.competitorCitations})
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
        {ties.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
              Tied ({ties.length})
            </p>
            <ul className="space-y-2">
              {ties.map((q) => (
                <li
                  key={q.queryId}
                  className="rounded-lg border border-zinc-600/50 bg-zinc-800/50 p-3 text-sm"
                >
                  <p className="text-zinc-200">{q.queryText || "(no text)"}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Both rank #{q.targetRank} · You: {q.targetCitations}, {competitorDomain}:{" "}
                    {q.competitorCitations}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
        {queries.length === 0 && (
          <p className="text-zinc-500">No shared queries with this competitor.</p>
        )}
      </div>
    </div>
  );
}
