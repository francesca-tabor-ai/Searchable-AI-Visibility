"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useCallback } from "react";

const NAV_LINKS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/competitors", label: "Competitive Analysis" },
  { href: "/dashboard/content", label: "Content Performance" },
  { href: "/dashboard/trends", label: "Visibility Trends" },
] as const;

export default function DashboardSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return (
    <>
      {/* Mobile menu button */}
      <button
        type="button"
        onClick={() => setMobileOpen((o) => !o)}
        className="fixed right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-searchable border border-[var(--border)] bg-[var(--bg)] shadow-sm transition-[background-color,box-shadow] duration-200 hover:bg-[var(--surface)] hover:shadow md:hidden"
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
      >
        <span className="flex h-5 w-5 flex-col justify-center gap-1">
          <span
            className={`h-0.5 w-4 bg-[var(--fg)] transition-transform duration-200 ${
              mobileOpen ? "translate-y-1.5 rotate-45" : ""
            }`}
          />
          <span
            className={`h-0.5 w-4 bg-[var(--fg)] transition-opacity duration-200 ${
              mobileOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`h-0.5 w-4 bg-[var(--fg)] transition-transform duration-200 ${
              mobileOpen ? "-translate-y-1.5 -rotate-45" : ""
            }`}
          />
        </span>
      </button>

      {/* Backdrop when mobile menu open */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/20 transition-opacity duration-200 md:hidden"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 z-40 h-full w-64 border-r border-[var(--border)] bg-[var(--bg)] transition-transform duration-200 ease-out
          md:static md:z-0 md:translate-x-0 md:border-r
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex h-full flex-col pt-16 md:pt-6">
          <div className="px-4 pb-3 md:px-3 md:pb-2">
            <Link
              href="/"
              onClick={closeMobile}
              className="text-lg font-bold tracking-tight text-[var(--fg)] transition-colors hover:text-[var(--accent)]"
            >
              Searchable
            </Link>
          </div>
          <nav className="flex flex-col gap-1 px-4 py-4 md:px-3">
            {NAV_LINKS.map(({ href, label }) => {
              const isActive =
                href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={closeMobile}
                  className={`
                    relative rounded-searchable px-4 py-3 text-sm transition-[background-color,color] duration-200
                    md:px-3 md:py-2.5
                    ${isActive
                      ? "border-l-4 border-[var(--accent)] bg-[var(--accent-soft)] font-semibold text-[var(--accent)]"
                      : "border-l-4 border-transparent font-medium text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--fg)]"
                    }
                  `}
                  style={{ cursor: "pointer" }}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
