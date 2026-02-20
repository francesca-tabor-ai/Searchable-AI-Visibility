import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col">
      {/* Header: dashboard link top right */}
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--bg)]/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6 md:px-10">
          <Link
            href="/"
            className="text-lg font-bold tracking-tight text-[var(--fg)]"
          >
            Searchable
          </Link>
          <nav>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-searchable-lg bg-gradient-searchable px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2"
            >
              Dashboard
              <span aria-hidden>→</span>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 px-6 py-12 md:px-10 md:py-20">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight text-[var(--fg)] md:text-5xl">
            AI search visibility
          </h1>
          <p className="mt-4 text-xl text-[var(--muted)] leading-relaxed">
            Citation tracking for serious teams. See how often AI answers cite
            your content and stay ahead of the curve.
          </p>
          <div className="mt-10">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-searchable-lg bg-gradient-searchable px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2"
            >
              Open dashboard
              <span aria-hidden>→</span>
            </Link>
          </div>

          <section className="mt-16">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
              For developers
            </h2>
            <ul className="mt-4 space-y-3 text-sm text-[var(--muted)] leading-relaxed">
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
          </section>
        </div>
      </main>
    </div>
  );
}
