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
    <div className="rounded-searchable-lg border border-[var(--border)] bg-[var(--bg)] shadow-xl">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
        <h3 className="font-semibold text-[var(--fg)]">
          Shared queries: you vs {competitorDomain}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-[var(--muted)] hover:bg-[var(--surface-elevated)] hover:text-[var(--fg)]"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
      <div className="max-h-[60vh] overflow-y-auto p-4">
        {competitorWins.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-amber-600">
              Queries {competitorDomain} is winning ({competitorWins.length})
            </p>
            <ul className="space-y-2">
              {competitorWins.map((q) => (
                <li
                  key={q.queryId}
                  className="rounded-searchable border border-amber-200 bg-amber-50/80 p-3 text-sm"
                >
                  <p className="text-[var(--fg)]">{q.queryText || "(no text)"}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
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
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--success)]">
              Queries you’re winning ({youWins.length})
            </p>
            <ul className="space-y-2">
              {youWins.map((q) => (
                <li
                  key={q.queryId}
                  className="rounded-searchable border border-emerald-200 bg-emerald-50/80 p-3 text-sm"
                >
                  <p className="text-[var(--fg)]">{q.queryText || "(no text)"}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
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
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
              Tied ({ties.length})
            </p>
            <ul className="space-y-2">
              {ties.map((q) => (
                <li
                  key={q.queryId}
                  className="rounded-searchable border border-[var(--border)] bg-[var(--surface)] p-3 text-sm"
                >
                  <p className="text-[var(--fg)]">{q.queryText || "(no text)"}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Both rank #{q.targetRank} · You: {q.targetCitations}, {competitorDomain}:{" "}
                    {q.competitorCitations}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
        {queries.length === 0 && (
          <p className="text-[var(--muted)]">No shared queries with this competitor.</p>
        )}
      </div>
    </div>
  );
}
