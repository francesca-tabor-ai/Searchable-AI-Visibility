import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { citations, responses, queries } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

type QueryRankRow = { query_id: string; domain: string; citation_count: number; rank_in_query: number };

/**
 * GET /api/competitors/compare?domain=target.com&competitor=comp.com&query_id=<uuid>
 * Side-by-side: for the given query, returns rank and citation count for target and competitor.
 * (Implements the logical "view" of citations + queries with rank per query.)
 */
export async function GET(request: NextRequest) {
  const domain = request.nextUrl.searchParams.get("domain")?.trim();
  const competitor = request.nextUrl.searchParams.get("competitor")?.trim();
  const queryId = request.nextUrl.searchParams.get("query_id")?.trim();

  if (!domain || !competitor || !queryId) {
    return NextResponse.json(
      { error: "Missing required query parameters: domain, competitor, query_id" },
      { status: 400 }
    );
  }

  try {
    const rows = await db.execute(sql`
      WITH per_domain AS (
        SELECT
          r.query_id,
          c.domain,
          count(*)::int AS citation_count
        FROM citations c
        JOIN responses r ON r.id = c.response_id
        WHERE r.query_id = ${queryId}
        GROUP BY r.query_id, c.domain
      ),
      ranked AS (
        SELECT
          query_id,
          domain,
          citation_count,
          rank() OVER (PARTITION BY query_id ORDER BY citation_count DESC)::int AS rank_in_query
        FROM per_domain
      )
      SELECT query_id, domain, citation_count, rank_in_query
      FROM ranked
      WHERE domain IN (${domain}, ${competitor})
    `);

    const result = rows as unknown;
    const raw: QueryRankRow[] = Array.isArray(result) ? (result as QueryRankRow[]) : ((result as { rows?: QueryRankRow[] }).rows ?? []);
    const queryText = await db
      .select({ text: queries.text })
      .from(queries)
      .where(eq(queries.id, queryId))
      .limit(1);

    const targetRow = raw.find((r) => r.domain === domain);
    const competitorRow = raw.find((r) => r.domain === competitor);

    return NextResponse.json({
      queryId,
      queryText: queryText[0]?.text ?? null,
      target: targetRow
        ? { domain, citationCount: targetRow.citation_count, rankInQuery: targetRow.rank_in_query }
        : null,
      competitor: competitorRow
        ? {
            domain: competitorRow.domain,
            citationCount: competitorRow.citation_count,
            rankInQuery: competitorRow.rank_in_query,
          }
        : null,
    });
  } catch (err) {
    console.error("Compare failed:", err);
    return NextResponse.json(
      {
        error: "Failed to compare",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
