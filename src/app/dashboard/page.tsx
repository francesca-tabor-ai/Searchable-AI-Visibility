import { Suspense } from "react";
import Overview from "@/components/dashboard/Overview";

export const metadata = {
  title: "Dashboard — Searchable",
  description: "Visibility Score overview",
};

function OverviewFallback() {
  return (
    <div className="rounded-xl border border-zinc-700/50 bg-zinc-900/50 p-8">
      <div className="h-32 animate-pulse rounded bg-zinc-800" />
      <div className="mt-4 h-24 animate-pulse rounded bg-zinc-800" />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] p-6 md:p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-white">Searchable</h1>
        <p className="mt-1 text-sm text-zinc-400">AI Search Visibility · Overview</p>
      </header>
      <section className="mx-auto max-w-4xl">
        <Suspense fallback={<OverviewFallback />}>
          <Overview />
        </Suspense>
      </section>
    </main>
  );
}
