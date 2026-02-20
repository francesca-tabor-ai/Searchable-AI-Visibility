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

const EMPTY_LABEL = "N/A";

function formatScore(value: number | null): string {
  if (value == null) return EMPTY_LABEL;
  return Number(value).toFixed(1);
}

function formatShare(value: number | null): string {
  if (value == null) return EMPTY_LABEL;
  return `${value}%`;
}

const FAVICON_URL = (domain: string) =>
  `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`;

function ProgressBar({ value, max = 100, label }: { value: number | null; max?: number; label: string }) {
  const pct = value != null && Number.isFinite(value) ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const showValue = value != null ? (label.toLowerCase().includes("citation") ? `${value}%` : value.toFixed(1)) : EMPTY_LABEL;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-[var(--muted)]">{label}</span>
        <span className="tabular-nums font-medium text-[var(--fg)]">{showValue}</span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-elevated)]"
        role="progressbar"
        aria-valuenow={value ?? 0}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function LeaderboardRowCard({
  entry,
  onSelectCompetitor,
}: {
  entry: LeaderboardEntry;
  onSelectCompetitor?: (domain: string) => void;
}) {
  return (
    <article
      className={`
        relative rounded-xl border transition-all duration-200 ease-out
        ${entry.isTarget
          ? "border-[var(--border)] border-l-4 border-l-[var(--accent)] bg-[var(--accent-soft)]"
          : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-elevated)]"
        }
        ${onSelectCompetitor && !entry.isTarget ? "cursor-pointer" : ""}
      `}
      style={{ padding: "18px 20px" }}
      onClick={() => !entry.isTarget && onSelectCompetitor?.(entry.domain)}
      role={onSelectCompetitor && !entry.isTarget ? "button" : undefined}
    >
      {/* Header row: rank + favicon + domain + [You] */}
      <div className="mb-4 flex items-center gap-3">
        <span className="tabular-nums text-lg font-semibold text-[var(--muted)]">#{entry.rank}</span>
        <img
          src={FAVICON_URL(entry.domain)}
          alt=""
          className="h-5 w-5 shrink-0 rounded"
          width={20}
          height={20}
        />
        <span
          className={`min-w-0 flex-1 truncate font-medium ${entry.isTarget ? "text-[var(--accent)]" : "text-[var(--fg)]"}`}
          title={entry.domain}
        >
          {entry.domain}
        </span>
        {entry.isTarget && (
          <span className="shrink-0 rounded-md bg-[var(--accent)] px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-white">
            You
          </span>
        )}
      </div>

      {/* Metrics with progress bars */}
      <div className="flex flex-col gap-4">
        <ProgressBar
          value={entry.visibilityScore}
          max={100}
          label="Visibility Score"
        />
        <ProgressBar
          value={entry.shareOfVoice}
          max={100}
          label="Citation Share"
        />
      </div>

      {/* Optional: show raw text when value is N/A so progress bar doesn't look empty */}
      {entry.visibilityScore == null && entry.shareOfVoice == null && (
        <p className="mt-2 text-xs text-[var(--muted-placeholder)]">
          {formatScore(entry.visibilityScore)} · {formatShare(entry.shareOfVoice)}
        </p>
      )}
    </article>
  );
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
  return (
    <div className="flex flex-col gap-3" style={{ gap: "10px" }}>
      {entries.map((e) => (
        <LeaderboardRowCard
          key={e.domain}
          entry={e}
          onSelectCompetitor={onSelectCompetitor}
        />
      ))}
    </div>
  );
}
