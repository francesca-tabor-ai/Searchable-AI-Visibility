import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

const TOP_N = 5;

type Row = { query_id: string; query_text: string | null; citation_count: number };

/**
 * GET /api/pages/queries?url=https%3A%2F%2Fexample.com%2Fpage
 * Returns the top 5 queries (by citation count) that cited this URL.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url")?.trim();
  if (!url) {
    return NextResponse.json(
      { error: "Missing required query parameter: url" },
      { status: 400 }
    );
  }

  try {
    const result = await db.execute(sql`
      SELECT
        q.id AS query_id,
        q.text AS query_text,
        count(*)::int AS citation_count
      FROM citations c
      JOIN responses r ON r.id = c.response_id
      JOIN queries q ON q.id = r.query_id
      WHERE c.url = ${url}
      GROUP BY q.id, q.text
      ORDER BY count(*) DESC
      LIMIT ${TOP_N}
    `);

    const raw = result as unknown;
    const rows: Row[] = Array.isArray(raw)
      ? (raw as Row[])
      : (raw as { rows?: Row[] }).rows ?? [];

    const queries = rows.map((r) => ({
      queryId: r.query_id,
      queryText: r.query_text ?? "",
      citationCount: Number(r.citation_count),
    }));

    return NextResponse.json({
      url,
      queries,
    });
  } catch (err) {
    console.error("Pages queries failed:", err);
    return NextResponse.json(
      {
        error: "Failed to load queries for URL",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
