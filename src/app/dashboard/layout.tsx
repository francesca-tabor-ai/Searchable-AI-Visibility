import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <nav className="border-b border-zinc-700/50 bg-zinc-900/30 px-6 py-3 md:px-8">
        <div className="mx-auto flex max-w-5xl items-center gap-6">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-zinc-400 transition hover:text-white"
          >
            Overview
          </Link>
          <Link
            href="/dashboard/competitors"
            className="text-sm font-medium text-zinc-400 transition hover:text-white"
          >
            Competitive Analysis
          </Link>
          <Link
            href="/dashboard/content"
            className="text-sm font-medium text-zinc-400 transition hover:text-white"
          >
            Content Performance
          </Link>
          <Link
            href="/dashboard/trends"
            className="text-sm font-medium text-zinc-400 transition hover:text-white"
          >
            Visibility Trends
          </Link>
        </div>
      </nav>
      {children}
    </div>
  );
}
