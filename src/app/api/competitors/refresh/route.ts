import { NextRequest, NextResponse } from "next/server";
import { refreshCompetitorMetrics } from "@/lib/competitors/refresh";
import { refreshCompetitorLeaderboardMV } from "@/lib/competitors/leaderboard-mv";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * POST /api/competitors/refresh
 * Body: { "domain"?: "target.com" } — optional; if omitted, refreshes for all domains with citations.
 * Secured by CRON_SECRET when set (Authorization: Bearer <CRON_SECRET>).
 */
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    let body: { domain?: string } = {};
    try {
      const raw = await request.json();
      if (typeof raw === "object" && raw !== null) body = raw as { domain?: string };
    } catch {
      // no body or invalid JSON is ok
    }
    const targetDomain = typeof body.domain === "string" ? body.domain.trim() || undefined : undefined;

    const results = await refreshCompetitorMetrics(targetDomain);
    const mv = await refreshCompetitorLeaderboardMV().catch((e) => ({
      refreshed: false,
      error: e instanceof Error ? e.message : String(e),
    }));
    return NextResponse.json({ ok: true, refreshed: results, leaderboardMV: mv });
  } catch (err) {
    console.error("Competitors refresh failed:", err);
    return NextResponse.json(
      {
        error: "Refresh failed",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
