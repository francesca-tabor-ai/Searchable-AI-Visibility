import { db } from "@/db";
import { sql } from "drizzle-orm";

export type CompetitorRow = {
  target_domain: string;
  competitor_domain: string;
  overlap_score: number;
  shared_queries: number;
  total_queries_target: number;
  competitor_visibility_score: number | null;
  competitor_rank: number | null;
  share_of_voice: number;
};

/**
 * Finds overlap domains (cited in the same query_id as target), overlap_score = shared_queries / total_queries_for_target,
 * ranks by visibility_score (RANK() window), and computes share_of_voice in shared queries.
 */
export async function computeCompetitorMetrics(
  targetDomain: string
): Promise<CompetitorRow[]> {
  const rows = await db.execute(sql`
    WITH target_queries AS (
      SELECT DISTINCT r.query_id
      FROM citations c
      JOIN responses r ON r.id = c.response_id
      WHERE c.domain = ${targetDomain}
    ),
    total_target AS (
      SELECT count(*)::int AS total
      FROM target_queries
    ),
    overlap AS (
      SELECT
        c.domain AS competitor_domain,
        count(DISTINCT r.query_id)::int AS shared_queries
      FROM citations c
      JOIN responses r ON r.id = c.response_id
      WHERE r.query_id IN (SELECT query_id FROM target_queries)
        AND c.domain <> ${targetDomain}
      GROUP BY c.domain
    ),
    voice AS (
      SELECT
        c.domain,
        count(*)::int AS citations_in_shared
      FROM citations c
      JOIN responses r ON r.id = c.response_id
      WHERE r.query_id IN (SELECT query_id FROM target_queries)
      GROUP BY c.domain
    ),
    total_voice AS (
      SELECT sum(citations_in_shared)::float AS total FROM voice
    ),
    with_scores AS (
      SELECT
        o.competitor_domain,
        o.shared_queries,
        t.total AS total_queries_target,
        (o.shared_queries::float / nullif(t.total, 0)) AS overlap_score,
        v.score AS competitor_visibility_score,
        (vo.citations_in_shared::float / nullif(tv.total, 0)) AS share_of_voice
      FROM overlap o
      CROSS JOIN total_target t
      LEFT JOIN domain_visibility_scores v ON v.domain = o.competitor_domain
      LEFT JOIN voice vo ON vo.domain = o.competitor_domain
      CROSS JOIN total_voice tv
    )
    SELECT
      ${targetDomain} AS target_domain,
      competitor_domain,
      overlap_score::float,
      shared_queries,
      total_queries_target,
      competitor_visibility_score::float,
      rank() OVER (ORDER BY competitor_visibility_score DESC NULLS LAST)::int AS competitor_rank,
      coalesce(share_of_voice, 0)::float AS share_of_voice
    FROM with_scores
    ORDER BY competitor_rank NULLS LAST, overlap_score DESC
  `);

  const result = rows as unknown;
  const raw: CompetitorRow[] = Array.isArray(result) ? (result as CompetitorRow[]) : ((result as { rows?: CompetitorRow[] }).rows ?? []);
  return raw.map((r) => ({
    ...r,
    overlap_score: Number(r.overlap_score),
    shared_queries: Number(r.shared_queries),
    total_queries_target: Number(r.total_queries_target),
    competitor_visibility_score: r.competitor_visibility_score != null ? Number(r.competitor_visibility_score) : null,
    competitor_rank: r.competitor_rank != null ? Number(r.competitor_rank) : null,
    share_of_voice: Number(r.share_of_voice),
  }));
}
