import { db } from "@/db";
import { competitorMetrics, citations, responses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { computeCompetitorMetrics } from "./discovery";

/**
 * Refreshes competitor_metrics for a target domain (or all targets).
 * Upserts rows for fast dashboard access.
 */
export async function refreshCompetitorMetrics(
  targetDomain?: string
): Promise<{ targetDomain: string; competitors: number }[]> {
  const targets: string[] = targetDomain
    ? [targetDomain]
    : await getDistinctTargetDomains();

  const results: { targetDomain: string; competitors: number }[] = [];
  const now = new Date();

  for (const target of targets) {
    const rows = await computeCompetitorMetrics(target);
    for (const r of rows) {
      await db
        .insert(competitorMetrics)
        .values({
          targetDomain: r.target_domain,
          competitorDomain: r.competitor_domain,
          overlapScore: r.overlap_score,
          sharedQueries: r.shared_queries,
          totalQueriesTarget: r.total_queries_target,
          competitorVisibilityScore: r.competitor_visibility_score,
          competitorRank: r.competitor_rank,
          shareOfVoice: r.share_of_voice,
          computedAt: now,
        })
        .onConflictDoUpdate({
          target: [competitorMetrics.targetDomain, competitorMetrics.competitorDomain],
          set: {
            overlapScore: r.overlap_score,
            sharedQueries: r.shared_queries,
            totalQueriesTarget: r.total_queries_target,
            competitorVisibilityScore: r.competitor_visibility_score,
            competitorRank: r.competitor_rank,
            shareOfVoice: r.share_of_voice,
            computedAt: now,
          },
        });
    }
    results.push({ targetDomain: target, competitors: rows.length });
  }

  return results;
}

async function getDistinctTargetDomains(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ domain: citations.domain })
    .from(citations)
    .innerJoin(responses, eq(responses.id, citations.responseId));
  return rows.map((r) => r.domain);
}
