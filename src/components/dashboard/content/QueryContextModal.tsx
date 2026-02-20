"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";

export type QueryRow = { queryId: string; queryText: string; citationCount: number };

export default function QueryContextModal({
  url,
  open,
  onOpenChange,
}: {
  url: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [queries, setQueries] = useState<QueryRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !url) {
      setQueries([]);
      return;
    }
    setLoading(true);
    fetch(`/api/pages/queries?url=${encodeURIComponent(url)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.queries) setQueries(data.queries);
        else setQueries([]);
      })
      .catch(() => setQueries([]))
      .finally(() => setLoading(false));
  }, [open, url]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-searchable-lg border border-[var(--border)] bg-[var(--bg)] shadow-xl outline-none"
          aria-describedby="query-context-description"
        >
          <div className="p-4">
            <Dialog.Title className="text-lg font-semibold text-[var(--fg)]">
              Query context
            </Dialog.Title>
            <Dialog.Description id="query-context-description" className="mt-1 text-sm text-[var(--muted)] leading-relaxed">
              Top queries that cited this page
            </Dialog.Description>
            {url && (
              <p className="mt-2 truncate text-xs text-[var(--muted)]" title={url}>
                {url}
              </p>
            )}
          </div>
          <div className="max-h-[60vh] overflow-y-auto border-t border-[var(--border)] px-4 py-3">
            {loading && (
              <div className="py-8 text-center text-sm text-[var(--muted)]">Loading…</div>
            )}
            {!loading && queries.length === 0 && (
              <div className="py-8 text-center text-sm text-[var(--muted)]">
                No queries found for this URL.
              </div>
            )}
            {!loading && queries.length > 0 && (
              <ol className="list-decimal space-y-3 pl-5">
                {queries.map((q) => (
                  <li key={q.queryId} className="text-sm">
                    <p className="text-[var(--fg)]">{q.queryText || "(no text)"}</p>
                    <p className="mt-0.5 text-xs text-[var(--muted)]">
                      Cited {q.citationCount} time{q.citationCount !== 1 ? "s" : ""}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </div>
          <div className="flex justify-end border-t border-[var(--border)] p-3">
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-searchable bg-[var(--surface-elevated)] px-4 py-2 text-sm font-medium text-[var(--fg)] hover:bg-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              >
                Close
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
