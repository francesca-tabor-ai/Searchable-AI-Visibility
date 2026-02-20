import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { competitorMetrics, domainVisibilityScores } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { computeCompetitorMetrics } from "@/lib/competitors/discovery";

export const dynamic = "force-dynamic";

/** Return full leaderboard; client handles search/filter/sort. */
const MAX_ENTRIES = 500;

/**
 * GET /api/competitors/leaderboard?domain=target.com
 * Returns leaderboard entries including the target domain (rank, visibility score, share of voice).
 * Sorted by visibility score descending; isTarget marks the user's domain.
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
    const targetScoreRow = await db
      .select({ score: domainVisibilityScores.score })
      .from(domainVisibilityScores)
      .where(eq(domainVisibilityScores.domain, domain))
      .limit(1);

    const targetVisibilityScore = targetScoreRow[0]?.score ?? null;

    const targetShareRows = await db.execute(sql`
      WITH target_queries AS (
        SELECT DISTINCT r.query_id
        FROM citations c
        JOIN responses r ON r.id = c.response_id
        WHERE c.domain = ${domain}
      ),
      voice AS (
        SELECT c.domain, count(*)::int AS citations_in_shared
        FROM citations c
        JOIN responses r ON r.id = c.response_id
        WHERE r.query_id IN (SELECT query_id FROM target_queries)
        GROUP BY c.domain
      ),
      total AS (SELECT sum(citations_in_shared)::float AS total FROM voice)
      SELECT (SELECT citations_in_shared FROM voice WHERE domain = ${domain})::float / nullif((SELECT total FROM total), 0) AS target_share
    `);
    const shareResult = targetShareRows as unknown;
    const shareRow = Array.isArray(shareResult)
      ? (shareResult as { target_share: number | null }[])[0]
      : (shareResult as { rows?: { target_share: number | null }[] }).rows?.[0];
    const targetShareOfVoice = shareRow?.target_share != null ? Number(shareRow.target_share) : null;

    const fromTable = await db
      .select()
      .from(competitorMetrics)
      .where(eq(competitorMetrics.targetDomain, domain))
      .orderBy(asc(competitorMetrics.competitorRank))
      .limit(MAX_ENTRIES);

    let competitors: {
      domain: string;
      visibilityScore: number | null;
      shareOfVoice: number | null;
      overlapPercent: number | null;
      rank: number;
    }[];

    if (fromTable.length > 0) {
      competitors = fromTable.map((r) => ({
        domain: r.competitorDomain,
        visibilityScore: r.competitorVisibilityScore != null ? Number(r.competitorVisibilityScore) : null,
        shareOfVoice: r.shareOfVoice != null ? Math.round(r.shareOfVoice * 100 * 10) / 10 : null,
        overlapPercent: r.overlapScore != null ? Math.round(r.overlapScore * 100 * 10) / 10 : null,
        rank: Number(r.competitorRank),
      }));
    } else {
      const computed = await computeCompetitorMetrics(domain);
      competitors = computed.slice(0, MAX_ENTRIES).map((r, i) => ({
        domain: r.competitor_domain,
        visibilityScore: r.competitor_visibility_score,
        shareOfVoice: Math.round(r.share_of_voice * 100 * 10) / 10,
        overlapPercent: Math.round(r.overlap_score * 100 * 10) / 10,
        rank: r.competitor_rank ?? i + 1,
      }));
    }

    type Entry = {
      rank: number;
      domain: string;
      visibilityScore: number | null;
      shareOfVoice: number | null;
      overlapPercent: number | null;
      isTarget: boolean;
    };

    const targetEntry: Entry = {
      rank: 0,
      domain,
      visibilityScore: targetVisibilityScore != null ? Number(targetVisibilityScore) : null,
      shareOfVoice: targetShareOfVoice != null ? Math.round(targetShareOfVoice * 100 * 10) / 10 : null,
      overlapPercent: null,
      isTarget: true,
    };

    const all: Entry[] = [targetEntry, ...competitors.map((c) => ({ ...c, isTarget: false }))];
    all.sort((a, b) => (b.visibilityScore ?? 0) - (a.visibilityScore ?? 0));
    all.forEach((e, i) => {
      e.rank = i + 1;
    });

    return NextResponse.json({
      domain,
      entries: all,
    });
  } catch (err) {
    console.error("Leaderboard failed:", err);
    return NextResponse.json(
      {
        error: "Failed to load leaderboard",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
