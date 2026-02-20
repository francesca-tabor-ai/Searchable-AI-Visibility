import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  domainVisibilityScores,
  domainVisibilityScoreHistory,
} from "@/db/schema";
import { desc, eq, and, gte } from "drizzle-orm";

export const dynamic = "force-dynamic";

const THIRTY_DAYS_AGO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

/**
 * GET /api/visibility-scores/overview?domain=example.com
 * Returns current score, trend, and last 30 days history for the domain.
 * If domain is omitted, uses the top domain by score.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let domain = searchParams.get("domain")?.trim() ?? null;

    const scores = await db
      .select()
      .from(domainVisibilityScores)
      .orderBy(desc(domainVisibilityScores.score));

    if (scores.length === 0) {
      return NextResponse.json({
        domain: null,
        score: null,
        previousScore: null,
        change: null,
        computedAt: null,
        history: [],
        domains: [],
      });
    }

    if (!domain) {
      domain = scores[0].domain;
    }

    const current = scores.find((s) => s.domain === domain) ?? scores[0];
    const historyRows = await db
      .select({
        computedAt: domainVisibilityScoreHistory.computedAt,
        score: domainVisibilityScoreHistory.score,
      })
      .from(domainVisibilityScoreHistory)
      .where(
        and(
          eq(domainVisibilityScoreHistory.domain, current.domain),
          gte(domainVisibilityScoreHistory.computedAt, THIRTY_DAYS_AGO)
        )
      )
      .orderBy(domainVisibilityScoreHistory.computedAt);

    const byDate = new Map<string, number>();
    for (const r of historyRows) {
      const d = r.computedAt instanceof Date ? r.computedAt.toISOString().slice(0, 10) : String(r.computedAt).slice(0, 10);
      byDate.set(d, Number(r.score));
    }
    const history = Array.from(byDate.entries())
      .map(([date, score]) => ({ date, score }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      domain: current.domain,
      score: current.score,
      previousScore: current.previousScore,
      change: current.change,
      computedAt: current.computedAt,
      history,
      domains: scores.map((s) => ({ domain: s.domain, score: s.score })),
    });
  } catch (err) {
    console.error("Overview failed:", err);
    return NextResponse.json(
      {
        error: "Failed to load overview",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
