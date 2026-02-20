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
      className="rounded p-1.5 text-zinc-400 hover:bg-zinc-700 hover:text-white focus:outline-none focus:ring-1 focus:ring-zinc-500"
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
      className="rounded p-1.5 text-zinc-400 hover:bg-zinc-700 hover:text-white focus:outline-none focus:ring-1 focus:ring-zinc-500"
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
          <span className="text-zinc-300">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor("citationCount", {
        header: "Citations",
        cell: (info) => (
          <span className="tabular-nums text-white">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor("uniqueQueryCount", {
        header: "Queries",
        cell: (info) => (
          <span className="tabular-nums text-zinc-300">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor("avgPosition", {
        header: "Avg pos",
        cell: (info) => {
          const v = info.getValue();
          return (
            <span className="tabular-nums text-zinc-400">
              {v != null ? v.toFixed(1) : "-"}
            </span>
          );
        },
      }),
      columnHelper.accessor("lastCitedAt", {
        header: "Last cited",
        cell: (info) => {
          const v = info.getValue();
          if (!v) return <span className="text-zinc-500">-</span>;
          try {
            const d = new Date(v);
            return (
              <span className="text-zinc-400" title={d.toISOString()}>
                {d.toLocaleDateString()}
              </span>
            );
          } catch {
            return <span className="text-zinc-500">-</span>;
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
            className="rounded px-2 py-1 text-xs font-medium text-blue-400 hover:bg-blue-500/20 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
    <div className="rounded-xl border border-zinc-700/50 bg-zinc-900/50">
      <div className="flex items-center gap-4 border-b border-zinc-700/50 p-3">
        <input
          type="text"
          placeholder="Search URLs…"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <span className="text-xs text-zinc-500">
          {table.getFilteredRowModel().rows.length} row(s)
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-zinc-700/50 bg-zinc-800/50">
                {hg.headers.map((h) => (
                  <th
                    key={h.id}
                    className="px-4 py-3 font-semibold text-zinc-300"
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
                className="cursor-pointer border-b border-zinc-700/30 hover:bg-zinc-800/70"
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
