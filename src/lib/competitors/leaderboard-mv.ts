import { db } from "@/db";
import { sql } from "drizzle-orm";

/**
 * Refreshes the competitor_leaderboard materialized view (daily recommended).
 * Run after refreshing competitor_metrics. No-op if the MV does not exist.
 */
export async function refreshCompetitorLeaderboardMV(): Promise<{
  refreshed: boolean;
  error?: string;
}> {
  try {
    await db.execute(sql.raw("REFRESH MATERIALIZED VIEW CONCURRENTLY competitor_leaderboard"));
    return { refreshed: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("does not exist") || message.includes("relation") || message.includes("undefined_table")) {
      return { refreshed: false, error: "Materialized view not created yet; run scripts/create-competitor-leaderboard-mv.sql" };
    }
    throw err;
  }
}
