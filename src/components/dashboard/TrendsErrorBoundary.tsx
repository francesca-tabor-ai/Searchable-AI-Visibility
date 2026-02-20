"use client";

import { Component, type ReactNode } from "react";

function hashString(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h = (h << 5) - h + c;
    h |= 0;
  }
  return Math.abs(h).toString(36).slice(0, 8);
}

type Props = {
  children: ReactNode;
  domain?: string;
  range?: string;
};

type State = {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
};

export default class TrendsErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    const errorId = hashString(`${error.message}-${Date.now()}`);
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  getDebugInfo(): string {
    const { domain, range } = this.props;
    const { error, errorId } = this.state;
    const env = typeof process !== "undefined" ? process.env.NODE_ENV : "unknown";
    let domainVal = domain ?? "—";
    let rangeVal = range ?? "—";
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (domainVal === "—") domainVal = params.get("domain") ?? "—";
      if (rangeVal === "—") rangeVal = params.get("range") ?? "30d";
    }
    const parts = [
      `Error ID: ${errorId ?? "—"}`,
      `Domain: ${domainVal}`,
      `Date range: ${rangeVal}`,
      `Environment: ${env}`,
      `Message: ${error?.message ?? "—"}`,
    ];
    if (error?.stack && env === "development") {
      parts.push(`Stack:\n${error.stack}`);
    }
    return parts.join("\n");
  }

  handleCopyDebug = () => {
    const text = this.getDebugInfo();
    navigator.clipboard.writeText(text).then(
      () => {},
      () => {}
    );
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const errorId = this.state.errorId ?? "unknown";
      return (
        <div className="mx-auto max-w-lg rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm md:p-8">
          <h2 className="text-lg font-semibold text-[var(--fg)]">
            Trends unavailable
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted-secondary)]">
            We hit an error loading this page. Try refreshing or come back later.
          </p>
          <p className="mt-2 text-xs text-[var(--muted)]">
            Error ID: <code className="rounded bg-[var(--surface-elevated)] px-1.5 py-0.5">{errorId}</code>
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={this.handleReload}
              className="rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-1"
            >
              Reload
            </button>
            <a
              href="/dashboard"
              className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-sm font-medium text-[var(--fg)] transition-colors hover:bg-[var(--surface-elevated)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-1"
            >
              Go back to Dashboard
            </a>
            <button
              type="button"
              onClick={this.handleCopyDebug}
              className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-sm font-medium text-[var(--fg)] transition-colors hover:bg-[var(--surface-elevated)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-1"
            >
              Copy debug info
            </button>
            <a
              href={`mailto:?subject=${encodeURIComponent(`Trends error ${errorId}`)}&body=${encodeURIComponent(this.getDebugInfo())}`}
              className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-sm font-medium text-[var(--fg)] transition-colors hover:bg-[var(--surface-elevated)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-1"
            >
              Report issue
            </a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
