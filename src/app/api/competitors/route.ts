import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { competitorMetrics } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { computeCompetitorMetrics } from "@/lib/competitors/discovery";

export const dynamic = "force-dynamic";

const TOP_N = 5;

/**
 * GET /api/competitors?domain=target.com
 * Returns top 5 competitors (by visibility rank) with scores, share of voice, and overlap %.
 * Reads from competitor_metrics when available; otherwise computes on the fly.
 */
export async function GET(request: NextRequest) {
  const domain = request.nextUrl.searchParams.get("domain")?.trim();
  if (!domain) {
    return NextResponse.json(
      { error: "Missing required query parameter: domain" },
      { status: 400 }
    );
  }

  try {
    const fromTable = await db
      .select()
      .from(competitorMetrics)
      .where(eq(competitorMetrics.targetDomain, domain))
      .orderBy(asc(competitorMetrics.competitorRank))
      .limit(TOP_N);

    if (fromTable.length >= TOP_N || fromTable.length > 0) {
      return NextResponse.json({
        domain,
        competitors: fromTable.map((r) => ({
          domain: r.competitorDomain,
          visibilityScore: r.competitorVisibilityScore,
          overlapPercent: r.overlapScore != null ? Math.round(r.overlapScore * 100 * 10) / 10 : null,
          shareOfVoice: r.shareOfVoice != null ? Math.round(r.shareOfVoice * 100 * 10) / 10 : null,
          sharedQueries: r.sharedQueries,
          totalQueriesTarget: r.totalQueriesTarget,
          rank: r.competitorRank,
        })),
      });
    }

    const computed = await computeCompetitorMetrics(domain);
    const top = computed.slice(0, TOP_N);
    return NextResponse.json({
      domain,
      competitors: top.map((r) => ({
        domain: r.competitor_domain,
        visibilityScore: r.competitor_visibility_score,
        overlapPercent: Math.round(r.overlap_score * 100 * 10) / 10,
        shareOfVoice: Math.round(r.share_of_voice * 100 * 10) / 10,
        sharedQueries: r.shared_queries,
        totalQueriesTarget: r.total_queries_target,
        rank: r.competitor_rank,
      })),
    });
  } catch (err) {
    console.error("Competitors failed:", err);
    return NextResponse.json(
      {
        error: "Failed to load competitors",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
