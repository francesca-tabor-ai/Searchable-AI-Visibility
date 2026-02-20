import { Suspense } from "react";
import Overview from "@/components/dashboard/Overview";

export const metadata = {
  title: "Dashboard — Searchable",
  description: "Visibility Score overview",
};

function OverviewFallback() {
  return (
    <div className="rounded-searchable-lg border border-[var(--border)] bg-[var(--surface)] p-8">
      <div className="h-32 animate-pulse rounded-lg bg-[var(--surface-elevated)]" />
      <div className="mt-4 h-24 animate-pulse rounded-lg bg-[var(--surface-elevated)]" />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] px-6 py-8 md:px-10 md:py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--fg)]">
          Searchable
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)] leading-relaxed">
          AI search visibility · Overview
        </p>
      </header>
      <section className="mx-auto max-w-4xl">
        <Suspense fallback={<OverviewFallback />}>
          <Overview />
        </Suspense>
      </section>
    </main>
  );
}
