/**
 * Railway worker: pings top-cited URLs to detect 404s / decaying content.
 *
 * Modes:
 *   --once   Run once and exit (for Railway Cron, e.g. daily).
 *   (default) Long-running: run immediately, then every 24h.
 *
 * Requires DATABASE_URL. Reads top N URLs from url_performance_metrics (by citation_count),
 * HEAD-requests each, and upserts results into url_health_check.
 */

import { runUrlHealthChecks } from "@/lib/url-health/check";

const INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
const TOP_N = parseInt(process.env.URL_HEALTH_TOP_N ?? "500", 10) || 500;

function log(
  event: "url_health_start" | "url_health_success" | "url_health_failure",
  data: Record<string, unknown>
) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    event,
    ...data,
  });
  console.log(line);
}

async function runOnce(): Promise<void> {
  const start = Date.now();
  log("url_health_start", { message: "URL health check started", topN: TOP_N });

  try {
    const result = await runUrlHealthChecks(TOP_N);
    const durationMs = Date.now() - start;
    log("url_health_success", {
      message: "URL health check completed",
      durationMs,
      checked: result.checked,
      ok: result.ok,
      failed: result.failed,
    });
  } catch (err) {
    const durationMs = Date.now() - start;
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    log("url_health_failure", {
      message: "URL health check failed",
      durationMs,
      error: message,
      ...(stack && { stack }),
    });
    throw err;
  }
}

async function main() {
  const once = process.argv.includes("--once");

  if (once) {
    await runOnce();
    process.exit(0);
  }

  log("url_health_start", {
    message: "URL health worker started (interval mode)",
    intervalHours: 24,
    topN: TOP_N,
  });

  const run = async () => {
    try {
      await runOnce();
    } catch {
      process.exitCode = 1;
    }
  };

  await run();
  setInterval(run, INTERVAL_MS);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
