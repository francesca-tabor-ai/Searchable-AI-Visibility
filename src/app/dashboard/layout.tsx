import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <nav className="border-b border-[var(--border)] bg-[var(--bg)] px-6 py-3 md:px-8">
        <div className="mx-auto flex max-w-5xl items-center gap-6">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-[var(--muted)] transition hover:text-[var(--fg)]"
          >
            Overview
          </Link>
          <Link
            href="/dashboard/competitors"
            className="text-sm font-medium text-[var(--muted)] transition hover:text-[var(--fg)]"
          >
            Competitive Analysis
          </Link>
          <Link
            href="/dashboard/content"
            className="text-sm font-medium text-[var(--muted)] transition hover:text-[var(--fg)]"
          >
            Content Performance
          </Link>
          <Link
            href="/dashboard/trends"
            className="text-sm font-medium text-[var(--muted)] transition hover:text-[var(--fg)]"
          >
            Visibility Trends
          </Link>
        </div>
      </nav>
      {children}
    </div>
  );
}
