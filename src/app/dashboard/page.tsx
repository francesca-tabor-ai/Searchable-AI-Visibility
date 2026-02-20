import { Suspense } from "react";
import Overview from "@/components/dashboard/Overview";

export const metadata = {
  title: "Dashboard — Searchable",
  description: "Visibility Score overview",
};

function OverviewFallback() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm md:p-8">
        <div className="h-32 animate-pulse rounded-lg bg-[var(--surface-elevated)]" />
      </div>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm md:p-8">
        <div className="h-48 animate-pulse rounded-lg bg-[var(--surface-elevated)]" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6 md:mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--fg)] md:text-[28px]">
          Searchable
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted-secondary)] md:text-base">
          AI search visibility · Overview
        </p>
      </header>
      <section>
        <Suspense fallback={<OverviewFallback />}>
          <Overview />
        </Suspense>
      </section>
    </div>
  );
}
