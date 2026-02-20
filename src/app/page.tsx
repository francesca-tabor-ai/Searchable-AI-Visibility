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
          <p className="mt-4 text-[var(--muted)] leading-relaxed">
            When users ask ChatGPT, Perplexity, or Claude a question, the answers
            often link to articles, docs, and product pages. If your domain
            isn’t in those citations, you’re invisible. Searchable ingests AI
            responses, tracks which URLs get cited, and gives you visibility
            scores, trends, and competitor benchmarks—so you can measure and
            improve how AI search surfaces your content.
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
            <h2 className="text-lg font-bold tracking-tight text-[var(--fg)]">
              Why it matters
            </h2>
            <p className="mt-2 text-[var(--muted)] leading-relaxed">
              AI search is becoming the front door to the web. Users trust
              answers that cite sources—and they click through. If your content
              is cited often, you get more qualified traffic and authority. If
              it isn’t, you need to know so you can adapt your content strategy,
              fix coverage gaps, and outpace competitors who are already
              optimizing for AI visibility.
            </p>
          </section>

          <section className="mt-12">
            <h2 className="text-lg font-bold tracking-tight text-[var(--fg)]">
              What you get
            </h2>
            <ul className="mt-4 space-y-2 text-[var(--muted)] leading-relaxed">
              <li>
                <strong className="text-[var(--fg)]">Visibility scores</strong> — Aggregate metrics so you can see how your domain performs over time and across models.
              </li>
              <li>
                <strong className="text-[var(--fg)]">Citation trends</strong> — Track which URLs and queries drive citations and spot changes early.
              </li>
              <li>
                <strong className="text-[var(--fg)]">Competitor benchmarks</strong> — See who else is getting cited for the same topics and where you stand.
              </li>
              <li>
                <strong className="text-[var(--fg)]">API-first</strong> — Ingest responses from any AI product, query citations and scores programmatically, and plug into your existing workflows.
              </li>
            </ul>
          </section>

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
