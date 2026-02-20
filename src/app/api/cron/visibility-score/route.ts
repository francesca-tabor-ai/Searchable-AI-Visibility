import { NextRequest, NextResponse } from "next/server";
import { runVisibilityScoreCalculation } from "@/lib/visibility-score/run";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

/**
 * Searchable Visibility Score™ calculation job.
 * Runs every 24h (e.g. via Vercel Cron or Railway Cron); computes scores per domain and stores in domain_visibility_scores.
 * Secured by CRON_SECRET when set.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { computed, at } = await runVisibilityScoreCalculation();
    return NextResponse.json({
      ok: true,
      computed,
      at: at.toISOString(),
    });
  } catch (err) {
    console.error("Visibility score cron failed:", err);
    return NextResponse.json(
      { error: "Visibility score failed", details: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
