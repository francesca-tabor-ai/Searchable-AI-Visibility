import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

type Row = {
  query_id: string;
  query_text: string | null;
  target_citations: number;
  competitor_citations: number;
  target_rank: number;
  competitor_rank: number;
};

/**
 * GET /api/competitors/queries?domain=target.com&competitor=comp.com
 * Returns shared queries between target and competitor with per-query rank and citation counts.
 * "Winner" is who has better (lower) rank in that query; tie if same rank.
 */
export async function GET(request: NextRequest) {
  const domain = request.nextUrl.searchParams.get("domain")?.trim();
  const competitor = request.nextUrl.searchParams.get("competitor")?.trim();

  if (!domain || !competitor) {
    return NextResponse.json(
      { error: "Missing required query parameters: domain, competitor" },
      { status: 400 }
    );
  }

  try {
    const rows = await db.execute(sql`
      WITH target_queries AS (
        SELECT DISTINCT r.query_id
        FROM citations c
        JOIN responses r ON r.id = c.response_id
        WHERE c.domain = ${domain}
      ),
      competitor_queries AS (
        SELECT DISTINCT r.query_id
        FROM citations c
        JOIN responses r ON r.id = c.response_id
        WHERE c.domain = ${competitor}
      ),
      shared AS (
        SELECT t.query_id
        FROM target_queries t
        INNER JOIN competitor_queries c ON c.query_id = t.query_id
      ),
      per_domain AS (
        SELECT
          r.query_id,
          c.domain,
          count(*)::int AS citation_count
        FROM citations c
        JOIN responses r ON r.id = c.response_id
        WHERE r.query_id IN (SELECT query_id FROM shared)
        GROUP BY r.query_id, c.domain
      ),
      ranked AS (
        SELECT
          query_id,
          domain,
          citation_count,
          rank() OVER (PARTITION BY query_id ORDER BY citation_count DESC)::int AS rank_in_query
        FROM per_domain
      ),
      both AS (
        SELECT
          r.query_id,
          max(CASE WHEN r.domain = ${domain} THEN r.citation_count END)::int AS target_citations,
          max(CASE WHEN r.domain = ${competitor} THEN r.citation_count END)::int AS competitor_citations,
          max(CASE WHEN r.domain = ${domain} THEN r.rank_in_query END)::int AS target_rank,
          max(CASE WHEN r.domain = ${competitor} THEN r.rank_in_query END)::int AS competitor_rank
        FROM ranked r
        GROUP BY r.query_id
        HAVING max(CASE WHEN r.domain = ${domain} THEN 1 END) = 1
           AND max(CASE WHEN r.domain = ${competitor} THEN 1 END) = 1
      )
      SELECT
        b.query_id,
        q.text AS query_text,
        b.target_citations,
        b.competitor_citations,
        b.target_rank,
        b.competitor_rank
      FROM both b
      LEFT JOIN queries q ON q.id = b.query_id
      ORDER BY b.target_rank ASC, b.competitor_rank ASC
    `);

    const result = rows as unknown;
    const raw: Row[] = Array.isArray(result)
      ? (result as Row[])
      : ((result as { rows?: Row[] }).rows ?? []);

    const queries = raw.map((r) => {
      const targetRank = Number(r.target_rank);
      const compRank = Number(r.competitor_rank);
      let winner: "target" | "competitor" | "tie" = "tie";
      if (targetRank < compRank) winner = "target";
      else if (compRank < targetRank) winner = "competitor";

      return {
        queryId: r.query_id,
        queryText: r.query_text ?? "",
        targetCitations: Number(r.target_citations),
        competitorCitations: Number(r.competitor_citations),
        targetRank,
        competitorRank: Number(r.competitor_rank),
        winner,
      };
    });

    return NextResponse.json({
      domain,
      competitor,
      queries,
    });
  } catch (err) {
    console.error("Competitors queries failed:", err);
    return NextResponse.json(
      {
        error: "Failed to load shared queries",
        details: err instanceof Error ? err.message : "Unknown",
      },
      { status: 500 }
    );
  }
}
