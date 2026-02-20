/**
 * Railway worker: runs Searchable Visibility Score™ calculation on a schedule.
 *
 * Modes:
 *   --once   Run once and exit (for Railway Cron: run this command every 24h).
 *   (default) Long-running process: run every 24h via setInterval.
 *
 * Requires DATABASE_URL (same as main app). Logs to stdout for Railway centralized logging.
 */

import { runVisibilityScoreCalculation } from "@/lib/visibility-score/run";

const INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

function log(
  event: "visibility_score_start" | "visibility_score_success" | "visibility_score_failure",
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
  log("visibility_score_start", { message: "Visibility score calculation started" });

  try {
    const result = await runVisibilityScoreCalculation();
    const durationMs = Date.now() - start;
    log("visibility_score_success", {
      message: "Visibility score calculation completed",
      durationMs,
      computed: result.computed,
      at: result.at.toISOString(),
    });
  } catch (err) {
    const durationMs = Date.now() - start;
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    log("visibility_score_failure", {
      message: "Visibility score calculation failed",
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

  // Long-running: run immediately, then every 24h
  log("visibility_score_start", { message: "Visibility score worker started (interval mode)", intervalHours: 24 });

  const run = async () => {
    try {
      await runOnce();
    } catch {
      process.exitCode = 1;
      // Keep process alive for next interval
    }
  };

  await run();
  setInterval(run, INTERVAL_MS);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
