import { NextResponse } from "next/server";
import { db } from "@/db";
import { domainVisibilityScores } from "@/db/schema";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * GET /api/visibility-scores — list Searchable Visibility Score™ per domain (latest run).
 */
export async function GET() {
  try {
    const rows = await db
      .select()
      .from(domainVisibilityScores)
      .orderBy(desc(domainVisibilityScores.score));

    return NextResponse.json({
      scores: rows.map((r) => ({
        domain: r.domain,
        score: r.score,
        previousScore: r.previousScore,
        change: r.change,
        computedAt: r.computedAt,
      })),
    });
  } catch (err) {
    console.error("Visibility scores list failed:", err);
    return NextResponse.json(
      { error: "Failed to list scores", details: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
