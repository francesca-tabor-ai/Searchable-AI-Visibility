"use client";

import { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";

export type PageRow = {
  url: string;
  domain: string;
  citationCount: number;
  uniqueQueryCount: number;
  avgPosition: number | null;
  lastCitedAt: string | null;
  computedAt: string;
  canonicalUrl: string | null;
};

/** Format date as "20 Feb 2026" */
function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
}

/** Short path for display: pathname or last segment */
function shortPath(url: string): string {
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/\/+$/, "") || "/";
    const segments = path.split("/").filter(Boolean);
    return segments.length > 0 ? `/${segments.slice(-2).join("/")}` : path || url;
  } catch {
    return url;
  }
}

function CopyButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); copy(); }}
      className="rounded p-2 text-[var(--muted)] transition-colors hover:bg-[var(--surface-elevated)] hover:text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-1"
      title="Copy URL"
      aria-label="Copy URL"
    >
      <span className="inline-block size-4 text-center text-sm leading-4" style={{ fontSize: "14px" }}>{copied ? "✓" : "⎘"}</span>
    </button>
  );
}

function LinkButton({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="rounded p-2 text-[var(--muted)] transition-colors hover:bg-[var(--surface-elevated)] hover:text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-1"
      title="Open in new tab"
      aria-label="Open URL"
    >
      <span className="inline-block size-4 text-center text-sm leading-4" style={{ fontSize: "14px" }}>↗</span>
    </a>
  );
}

const columnHelper = createColumnHelper<PageRow>();

export default function UrlLeaderboard({
  pages,
  onRowClick,
  globalFilter: controlledFilter,
  onGlobalFilterChange,
  resultCountLabel = (n) => (n === 1 ? "1 result" : `${n} results`),
}: {
  pages: PageRow[];
  onRowClick: (url: string) => void;
  globalFilter?: string;
  onGlobalFilterChange?: (v: string) => void;
  resultCountLabel?: (n: number) => string;
}) {
  const [internalFilter, setInternalFilter] = useState("");
  const globalFilter = controlledFilter !== undefined ? controlledFilter : internalFilter;
  const setGlobalFilter = onGlobalFilterChange ?? setInternalFilter;
  const showSearchInCard = controlledFilter === undefined && onGlobalFilterChange === undefined;

  const [sorting, setSorting] = useState<SortingState>([
    { id: "citationCount", desc: true },
  ]);

  const columns = useMemo(
    () => [
      columnHelper.accessor("url", {
        header: "URL",
        cell: (info) => {
          const url = info.getValue();
          const short = shortPath(url);
          return (
            <div className="min-w-0">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="block truncate font-medium text-[var(--accent)] hover:underline"
                title={url}
              >
                {short}
              </a>
              <p className="mt-0.5 truncate text-xs text-[var(--muted-secondary)]" title={url}>
                {url}
              </p>
            </div>
          );
        },
      }),
      columnHelper.accessor("citationCount", {
        header: "Citations",
        cell: (info) => (
          <span className="tabular-nums font-medium text-[var(--fg)]">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor("uniqueQueryCount", {
        header: "Queries",
        cell: (info) => (
          <span className="tabular-nums text-[var(--fg)]">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor("avgPosition", {
        header: "Avg pos",
        cell: (info) => {
          const v = info.getValue();
          return (
            <span className="tabular-nums text-[var(--muted)]">
              {v != null ? v.toFixed(1) : "—"}
            </span>
          );
        },
      }),
      columnHelper.accessor("lastCitedAt", {
        header: "Last cited",
        cell: (info) => (
          <span className="text-[var(--muted)]" title={info.getValue() ?? undefined}>
            {formatDate(info.getValue())}
          </span>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const url = row.original.url;
          return (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <CopyButton url={url} />
              <LinkButton url={url} />
              <button
                type="button"
                onClick={() => onRowClick(url)}
                className="rounded px-3 py-1.5 text-xs font-medium text-white bg-[var(--accent)] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-1 transition-opacity"
              >
                Queries
              </button>
            </div>
          );
        },
      }),
    ],
    [onRowClick]
  );

  const table = useReactTable({
    data: pages,
    columns,
    state: { globalFilter, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: "includesString",
  });

  const filteredRows = table.getFilteredRowModel().rows;
  const count = filteredRows.length;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-medium text-[var(--fg)] md:text-lg">URL Leaderboard</h2>
        <span className="text-sm text-[var(--muted-secondary)]">{resultCountLabel(count)}</span>
      </div>

      {showSearchInCard && (
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search URL…"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="h-10 w-full max-w-xs min-h-[40px] rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--fg)] placeholder-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-1"
          />
        </div>
      )}

      {count === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface-elevated)] py-12 text-center text-sm text-[var(--muted-placeholder)]">
          {pages.length === 0
            ? "No URLs yet. Connect sources or run the audit tool."
            : "No URLs match your search."}
        </div>
      ) : (
        <div className="overflow-x-auto -mx-1">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="sticky top-0 z-10 bg-[var(--surface-elevated)]">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="border-b border-[var(--border)]">
                  {hg.headers.map((h) => (
                    <th
                      key={h.id}
                      className="px-4 py-3 font-semibold text-[var(--muted)]"
                      style={{ width: h.getSize() !== 150 ? undefined : h.getSize() }}
                    >
                      <div
                        className={
                          h.column.getCanSort()
                            ? "cursor-pointer select-none"
                            : ""
                        }
                        onClick={h.column.getToggleSortingHandler()}
                      >
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        {h.column.getIsSorted() === "asc" ? " ↑" : h.column.getIsSorted() === "desc" ? " ↓" : ""}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {filteredRows.map((row, i) => (
                <tr
                  key={row.id}
                  className={`cursor-pointer border-b border-[var(--border)] transition-colors hover:bg-[var(--surface-elevated)] ${i % 2 === 1 ? "bg-[var(--surface-elevated)]/50" : ""}`}
                  onClick={() => onRowClick(row.original.url)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
