import { db } from "@/db";
import { sql } from "drizzle-orm";

export type DomainAggregationRow = {
  domain: string;
  domainCitationCount: number;
  avgPosition: number | null;
  distinctQueries: number;
  totalCitations: number;
  totalQueries: number;
  recencyWeightSum: number;
};

type RawRow = {
  domain: string;
  domain_citation_count: number;
  avg_position: number | null;
  distinct_queries: number;
  total_citations: number;
  total_queries: number;
  recency_weight_sum: number;
};

function toAggregationRow(r: RawRow): DomainAggregationRow {
  return {
    domain: r.domain,
    domainCitationCount: Number(r.domain_citation_count),
    avgPosition: r.avg_position != null ? Number(r.avg_position) : null,
    distinctQueries: Number(r.distinct_queries),
    totalCitations: Number(r.total_citations),
    totalQueries: Number(r.total_queries),
    recencyWeightSum: Number(r.recency_weight_sum),
  };
}

/**
 * Aggregates metrics per domain for Visibility Score:
 * - citation_share = domain citations / total citations
 * - query_coverage = distinct queries with domain / total queries
 * - avg_position = average rank of citation within response (1 = first)
 * - recency_weight_sum = sum of exp decay weights for citations in last 30 days (half-life ~15 days)
 */
export async function getDomainAggregations(): Promise<DomainAggregationRow[]> {
  const result = await db.execute(sql`
    WITH totals AS (
      SELECT
        (SELECT count(*)::int FROM citations) AS total_citations,
        (SELECT count(*)::int FROM queries) AS total_queries
    ),
    positioned AS (
      SELECT
        c.domain,
        c.response_id,
        c.created_at,
        c.id,
        row_number() OVER (PARTITION BY c.response_id ORDER BY c.created_at, c.id) AS position
      FROM citations c
    ),
    recency AS (
      SELECT
        domain,
        sum(exp(-0.0462 * extract(epoch FROM (now() - created_at)) / 86400.0))::float AS recency_weight
      FROM citations
      WHERE created_at >= now() - interval '30 days'
      GROUP BY domain
    ),
    domain_metrics AS (
      SELECT
        p.domain,
        count(*)::int AS domain_citation_count,
        avg(p.position)::float AS avg_position,
        count(DISTINCT r.query_id)::int AS distinct_queries
      FROM positioned p
      JOIN responses r ON r.id = p.response_id
      GROUP BY p.domain
    )
    SELECT
      dm.domain,
      dm.domain_citation_count,
      dm.avg_position,
      dm.distinct_queries,
      t.total_citations,
      t.total_queries,
      coalesce(rec.recency_weight, 0)::float AS recency_weight_sum
    FROM domain_metrics dm
    CROSS JOIN totals t
    LEFT JOIN recency rec ON rec.domain = dm.domain
  `);

  const raw = result as unknown;
  const rows: RawRow[] = Array.isArray(raw) ? (raw as RawRow[]) : ((raw as { rows?: RawRow[] }).rows ?? []);
  return rows.map(toAggregationRow);
}
