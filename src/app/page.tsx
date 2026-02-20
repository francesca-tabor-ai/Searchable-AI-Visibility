import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--bg)] px-6 py-12 md:px-10 md:py-16">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--fg)] md:text-4xl">
          Searchable
        </h1>
        <p className="mt-2 text-lg text-[var(--muted)] leading-relaxed">
          AI search visibility — citation tracking for serious teams.
        </p>
        <nav className="mt-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-searchable-lg bg-gradient-searchable px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2"
          >
            Open dashboard
            <span aria-hidden>→</span>
          </Link>
        </nav>
        <ul className="mt-12 space-y-3 text-sm text-[var(--muted)] leading-relaxed">
          <li>
            <code className="rounded-md bg-[var(--surface)] px-1.5 py-0.5 font-medium text-[var(--fg)]">
              POST /api/ingest
            </code>
            <span className="ml-1">— Ingest AI response</span>
          </li>
          <li>
            <code className="rounded-md bg-[var(--surface)] px-1.5 py-0.5 font-medium text-[var(--fg)]">
              GET /api/citations?domain=...&model=...
            </code>
            <span className="ml-1">— List citations</span>
          </li>
          <li>
            <code className="rounded-md bg-[var(--surface)] px-1.5 py-0.5 font-medium text-[var(--fg)]">
              GET /api/visibility-scores
            </code>
            <span className="ml-1">— Visibility scores</span>
          </li>
        </ul>
      </div>
    </main>
  );
}
