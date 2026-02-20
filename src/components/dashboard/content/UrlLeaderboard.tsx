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
      className="rounded p-1.5 text-[var(--muted)] hover:bg-[var(--surface-elevated)] hover:text-[var(--fg)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
      title="Copy URL"
      aria-label="Copy URL"
    >
      {copied ? "✓" : "⎘"}
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
      className="rounded p-1.5 text-[var(--muted)] hover:bg-[var(--surface-elevated)] hover:text-[var(--fg)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
      title="Open in new tab"
      aria-label="Open URL"
    >
      ↗
    </a>
  );
}

const columnHelper = createColumnHelper<PageRow>();

export default function UrlLeaderboard({
  pages,
  onRowClick,
}: {
  pages: PageRow[];
  onRowClick: (url: string) => void;
}) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([
    { id: "citationCount", desc: true },
  ]);

  const columns = useMemo(
    () => [
      columnHelper.accessor("url", {
        header: "URL",
        cell: (info) => {
          const url = info.getValue();
          return (
            <div className="flex items-center gap-1">
              <CopyButton url={url} />
              <LinkButton url={url} />
              <span className="truncate max-w-[280px] sm:max-w-[360px]" title={url}>
                {url}
              </span>
            </div>
          );
        },
      }),
      columnHelper.accessor("domain", {
        header: "Domain",
        cell: (info) => (
          <span className="text-[var(--fg)]">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor("citationCount", {
        header: "Citations",
        cell: (info) => (
          <span className="tabular-nums text-[var(--fg)] font-medium">{info.getValue()}</span>
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
              {v != null ? v.toFixed(1) : "-"}
            </span>
          );
        },
      }),
      columnHelper.accessor("lastCitedAt", {
        header: "Last cited",
        cell: (info) => {
          const v = info.getValue();
          if (!v) return <span className="text-[var(--muted)]">-</span>;
          try {
            const d = new Date(v);
            return (
              <span className="text-[var(--muted)]" title={d.toISOString()}>
                {d.toLocaleDateString()}
              </span>
            );
          } catch {
            return <span className="text-[var(--muted)]">-</span>;
          }
        },
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRowClick(row.original.url); }}
            className="rounded px-2 py-1 text-xs font-medium text-[var(--accent)] hover:bg-[var(--accent-soft)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          >
            Queries
          </button>
        ),
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

  return (
    <div className="rounded-searchable-lg border border-[var(--border)] bg-[var(--surface)]">
      <div className="flex items-center gap-4 border-b border-[var(--border)] p-3">
        <input
          type="text"
          placeholder="Search URLs…"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="rounded-searchable border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--fg)] placeholder-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        />
        <span className="text-xs text-[var(--muted)]">
          {table.getFilteredRowModel().rows.length} row(s)
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-[var(--border)] bg-[var(--surface-elevated)]">
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
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="cursor-pointer border-b border-[var(--border)] hover:bg-[var(--surface-elevated)]"
                onClick={() => onRowClick(row.original.url)}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-2.5">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
