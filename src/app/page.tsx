import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--bg)] p-6 md:p-8">
      <h1 className="text-2xl font-bold tracking-tight text-white">Searchable</h1>
      <p className="mt-1 text-zinc-400">AI Search Visibility — Citation Tracking</p>
      <nav className="mt-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
        >
          Dashboard →
        </Link>
      </nav>
      <ul className="mt-8 space-y-2 text-sm text-zinc-400">
        <li><code className="text-zinc-300">POST /api/ingest</code> — Ingest AI response</li>
        <li><code className="text-zinc-300">GET /api/citations?domain=...&model=...</code> — List citations</li>
        <li><code className="text-zinc-300">GET /api/visibility-scores</code> — Visibility scores</li>
      </ul>
    </main>
  );
}
