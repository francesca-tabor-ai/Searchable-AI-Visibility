"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LeaderboardTable from "@/components/dashboard/competitors/LeaderboardTable";
import type { LeaderboardEntry, SortKey, SortDir } from "@/components/dashboard/competitors/LeaderboardTable";

const DEBOUNCE_MS = 200;
const URL_KEYS = {
  q: "q",
  scoreMin: "scoreMin",
  scoreMax: "scoreMax",
  citationMin: "citationMin",
  citationMax: "citationMax",
  show: "show",
  sort: "sort",
  dir: "dir",
} as const;

export type { SortKey, SortDir };
export type ShowFilter = "all" | "withScore" | "naOnly";

function parseNum(s: string | null): number | "" {
  if (s == null || s === "") return "";
  const n = Number(s);
  return Number.isFinite(n) ? n : "";
}

function matchesSearch(entry: LeaderboardEntry, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  const domain = entry.domain.toLowerCase();
  const rank = String(entry.rank);
  const score = entry.visibilityScore != null ? String(entry.visibilityScore) : "";
  const citation = entry.shareOfVoice != null ? String(entry.shareOfVoice) : "";
  return (
    domain.includes(q) ||
    rank.includes(q) ||
    score.includes(q) ||
    citation.includes(q)
  );
}

function filterByScore(entry: LeaderboardEntry, min: number | "", max: number | ""): boolean {
  const s = entry.visibilityScore;
  if (s == null) return true; // N/A handled by show filter
  if (min !== "" && s < min) return false;
  if (max !== "" && s > max) return false;
  return true;
}

function filterByCitation(entry: LeaderboardEntry, min: number | "", max: number | ""): boolean {
  const c = entry.shareOfVoice;
  if (c == null) return true;
  if (min !== "" && c < min) return false;
  if (max !== "" && c > max) return false;
  return true;
}

function filterByShow(entry: LeaderboardEntry, show: ShowFilter): boolean {
  const hasScore = entry.visibilityScore != null;
  if (show === "all") return true;
  if (show === "withScore") return hasScore;
  if (show === "naOnly") return !hasScore;
  return true;
}

function compareEntries(
  a: LeaderboardEntry,
  b: LeaderboardEntry,
  sortBy: SortKey | "",
  dir: SortDir
): number {
  if (!sortBy) return 0;
  const mult = dir === "asc" ? 1 : -1;

  switch (sortBy) {
    case "rank": {
      return mult * (a.rank - b.rank);
    }
    case "domain": {
      return mult * a.domain.localeCompare(b.domain, undefined, { sensitivity: "base" });
    }
    case "visibilityScore": {
      const va = a.visibilityScore ?? -Infinity;
      const vb = b.visibilityScore ?? -Infinity;
      return mult * (va - vb);
    }
    case "citationShare": {
      const va = a.shareOfVoice ?? -Infinity;
      const vb = b.shareOfVoice ?? -Infinity;
      return mult * (va - vb);
    }
    default:
      return 0;
  }
}

export default function LeaderboardCard({
  entries,
  onSelectCompetitor,
}: {
  entries: LeaderboardEntry[];
  onSelectCompetitor?: (domain: string) => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const qFromUrl = searchParams.get(URL_KEYS.q) ?? "";
  const scoreMinFromUrl = parseNum(searchParams.get(URL_KEYS.scoreMin));
  const scoreMaxFromUrl = parseNum(searchParams.get(URL_KEYS.scoreMax));
  const citationMinFromUrl = parseNum(searchParams.get(URL_KEYS.citationMin));
  const citationMaxFromUrl = parseNum(searchParams.get(URL_KEYS.citationMax));
  const showFromUrl = (searchParams.get(URL_KEYS.show) as ShowFilter) || "all";
  const sortFromUrl = (searchParams.get(URL_KEYS.sort) as SortKey) || "rank";
  const dirFromUrl = (searchParams.get(URL_KEYS.dir) as SortDir) || "asc";

  const [searchInput, setSearchInput] = useState(qFromUrl);
  const [debouncedQuery, setDebouncedQuery] = useState(qFromUrl);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchInput), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  const updateUrl = useCallback(
    (updates: Partial<Record<keyof typeof URL_KEYS, string | null>>) => {
      const params = new URLSearchParams(searchParams.toString());
      (Object.entries(updates) as [keyof typeof URL_KEYS, string | null][]).forEach(
        ([key, value]) => {
          if (value === null || value === "") params.delete(key);
          else params.set(key, value);
        }
      );
      const query = params.toString();
      router.replace(query ? `?${query}` : window.location.pathname, { scroll: false });
    },
    [router, searchParams]
  );

  const scoreMin = scoreMinFromUrl;
  const scoreMax = scoreMaxFromUrl;
  const citationMin = citationMinFromUrl;
  const citationMax = citationMaxFromUrl;
  const showFilter = showFromUrl;
  const sortBy = sortFromUrl;
  const sortDir = dirFromUrl;

  const setScoreMin = (v: number | "") => updateUrl({ scoreMin: v === "" ? null : String(v) });
  const setScoreMax = (v: number | "") => updateUrl({ scoreMax: v === "" ? null : String(v) });
  const setCitationMin = (v: number | "") => updateUrl({ citationMin: v === "" ? null : String(v) });
  const setCitationMax = (v: number | "") => updateUrl({ citationMax: v === "" ? null : String(v) });
  const setShowFilter = (v: ShowFilter) => updateUrl({ show: v === "all" ? null : v });
  const setSort = (key: SortKey, dir: SortDir) => {
    updateUrl({ sort: key, dir });
  };

  useEffect(() => {
    if (debouncedQuery !== (searchParams.get(URL_KEYS.q) ?? "")) {
      updateUrl({ q: debouncedQuery.trim() || null });
    }
  }, [debouncedQuery]);
  useEffect(() => {
    if (qFromUrl !== debouncedQuery) setSearchInput(qFromUrl);
  }, [qFromUrl]);

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (!matchesSearch(e, debouncedQuery)) return false;
      if (!filterByScore(e, scoreMin, scoreMax)) return false;
      if (!filterByCitation(e, citationMin, citationMax)) return false;
      if (!filterByShow(e, showFilter)) return false;
      return true;
    });
  }, [entries, debouncedQuery, scoreMin, scoreMax, citationMin, citationMax, showFilter]);

  const sorted = useMemo(() => {
    if (!sortBy) return [...filtered];
    return [...filtered].sort((a, b) => compareEntries(a, b, sortBy, sortDir));
  }, [filtered, sortBy, sortDir]);

  const totalCount = entries.length;
  const filteredCount = sorted.length;
  const hasActiveFilters =
    debouncedQuery.trim() !== "" ||
    scoreMin !== "" ||
    scoreMax !== "" ||
    citationMin !== "" ||
    citationMax !== "" ||
    showFilter !== "all";

  const clearAllFilters = useCallback(() => {
    setSearchInput("");
    updateUrl({
      q: null,
      scoreMin: null,
      scoreMax: null,
      citationMin: null,
      citationMax: null,
      show: null,
    });
  }, [updateUrl]);

  const removeChip = useCallback(
    (key: keyof typeof URL_KEYS, value?: string) => {
      if (key === "q") {
        setSearchInput("");
        updateUrl({ q: null });
      } else if (key === "scoreMin") updateUrl({ scoreMin: null });
      else if (key === "scoreMax") updateUrl({ scoreMax: null });
      else if (key === "citationMin") updateUrl({ citationMin: null });
      else if (key === "citationMax") updateUrl({ citationMax: null });
      else if (key === "show") updateUrl({ show: null });
    },
    [updateUrl]
  );

  const chips = useMemo(() => {
    const list: { key: keyof typeof URL_KEYS; label: string }[] = [];
    if (debouncedQuery.trim()) list.push({ key: "q", label: `Search: "${debouncedQuery.trim()}"` });
    if (scoreMin !== "") list.push({ key: "scoreMin", label: `Score ≥ ${scoreMin}` });
    if (scoreMax !== "") list.push({ key: "scoreMax", label: `Score ≤ ${scoreMax}` });
    if (citationMin !== "") list.push({ key: "citationMin", label: `Citation ≥ ${citationMin}%` });
    if (citationMax !== "") list.push({ key: "citationMax", label: `Citation ≤ ${citationMax}%` });
    if (showFilter === "withScore") list.push({ key: "show", label: "Show: With score" });
    if (showFilter === "naOnly") list.push({ key: "show", label: "Show: N/A only" });
    return list;
  }, [debouncedQuery, scoreMin, scoreMax, citationMin, citationMax, showFilter]);

  return (
    <div className="flex flex-col gap-3">
      {/* Search */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Search domains…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="h-9 min-w-[200px] max-w-xs rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-sm text-[var(--fg)] placeholder:text-[var(--muted-placeholder)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-1"
          aria-label="Search domains"
        />
        {/* Quick filters row */}
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-[var(--muted)]">Visibility Score</span>
          <input
            type="number"
            min={0}
            max={100}
            step={0.1}
            placeholder="Min"
            value={scoreMin === "" ? "" : scoreMin}
            onChange={(e) => setScoreMin(parseNum(e.target.value))}
            className="h-8 w-16 rounded border border-[var(--border)] bg-[var(--bg)] px-2 text-[var(--fg)] focus:border-[var(--accent)] focus:outline-none"
          />
          <span className="text-[var(--muted)]">–</span>
          <input
            type="number"
            min={0}
            max={100}
            step={0.1}
            placeholder="Max"
            value={scoreMax === "" ? "" : scoreMax}
            onChange={(e) => setScoreMax(parseNum(e.target.value))}
            className="h-8 w-16 rounded border border-[var(--border)] bg-[var(--bg)] px-2 text-[var(--fg)] focus:border-[var(--accent)] focus:outline-none"
          />
          <span className="ml-2 text-[var(--muted)]">Citation %</span>
          <input
            type="number"
            min={0}
            max={100}
            step={0.1}
            placeholder="Min"
            value={citationMin === "" ? "" : citationMin}
            onChange={(e) => setCitationMin(parseNum(e.target.value))}
            className="h-8 w-16 rounded border border-[var(--border)] bg-[var(--bg)] px-2 text-[var(--fg)] focus:border-[var(--accent)] focus:outline-none"
          />
          <span className="text-[var(--muted)]">–</span>
          <input
            type="number"
            min={0}
            max={100}
            step={0.1}
            placeholder="Max"
            value={citationMax === "" ? "" : citationMax}
            onChange={(e) => setCitationMax(parseNum(e.target.value))}
            className="h-8 w-16 rounded border border-[var(--border)] bg-[var(--bg)] px-2 text-[var(--fg)] focus:border-[var(--accent)] focus:outline-none"
          />
          <span className="ml-2 text-[var(--muted)]">Show</span>
          <select
            value={showFilter}
            onChange={(e) => setShowFilter(e.target.value as ShowFilter)}
            className="h-8 rounded border border-[var(--border)] bg-[var(--bg)] px-2 text-sm text-[var(--fg)] focus:border-[var(--accent)] focus:outline-none"
          >
            <option value="all">All</option>
            <option value="withScore">With score</option>
            <option value="naOnly">N/A only</option>
          </select>
        </div>
      </div>

      {/* Chips + Clear all */}
      {(chips.length > 0 || hasActiveFilters) && (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map(({ key, label }) => (
            <span
              key={`${key}-${label}`}
              className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface-elevated)] px-2.5 py-1 text-xs text-[var(--fg)]"
            >
              {label}
              <button
                type="button"
                onClick={() => removeChip(key)}
                className="rounded p-0.5 hover:bg-[var(--border)]"
                aria-label={`Remove ${label}`}
              >
                ✕
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={clearAllFilters}
            className="text-xs text-[var(--muted)] underline hover:text-[var(--fg)]"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Sort dropdown */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-[var(--muted)]">Sort by:</span>
        <select
          value={`${sortBy}-${sortDir}`}
          onChange={(e) => {
            const [key, d] = e.target.value.split("-") as [SortKey, SortDir];
            setSort(key, d);
          }}
          className="h-8 rounded border border-[var(--border)] bg-[var(--bg)] px-2 text-[var(--fg)] focus:border-[var(--accent)] focus:outline-none"
        >
          <option value="rank-asc">Rank (asc)</option>
          <option value="rank-desc">Rank (desc)</option>
          <option value="domain-asc">Domain (A–Z)</option>
          <option value="domain-desc">Domain (Z–A)</option>
          <option value="visibilityScore-desc">Visibility Score (high first)</option>
          <option value="visibilityScore-asc">Visibility Score (low first)</option>
          <option value="citationShare-desc">Citation Share (high first)</option>
          <option value="citationShare-asc">Citation Share (low first)</option>
        </select>
      </div>

      {/* Summary */}
      <p className="text-sm text-[var(--muted)]">
        {hasActiveFilters
          ? `Filtered to ${filteredCount} of ${totalCount} competitors`
          : `Showing ${totalCount} of ${totalCount} competitors`}
      </p>

      {/* Empty state */}
      {filteredCount === 0 && (
        <p className="rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] p-4 text-sm text-[var(--muted)]">
          {debouncedQuery.trim()
            ? `No competitors match "${debouncedQuery.trim()}". Clear search`
            : "No competitors match the current filters. Clear filters."}
        </p>
      )}

      {/* Table */}
      {filteredCount > 0 && (
        <LeaderboardTable
          entries={sorted}
          onSelectCompetitor={onSelectCompetitor}
          sortBy={sortBy}
          sortDir={sortDir}
          onSortChange={setSort}
        />
      )}
    </div>
  );
}
