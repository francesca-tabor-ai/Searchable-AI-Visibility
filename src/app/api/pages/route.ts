import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { urlPerformanceMetrics, urlCanonicalMapping } from "@/db/schema";
import { eq, and, desc, sql, inArray, gt, isNotNull } from "drizzle-orm";

export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 2000; // allow large fetch for Content Performance audit table

type ViewType = "all" | "top_performers" | "opportunity";

/**
 * GET /api/pages?domain=target.com&page=1&limit=20&view=all|top_performers|opportunity
 * Returns paginated URL-level metrics for the domain.
 * - view=top_performers: highest citation_count first
 * - view=opportunity: avg_position > 3 (low rank, room to improve)
 * - view=all (default): all URLs for the domain
 * Includes canonical_url when the URL is a redirect/canonical target.
 */
export async function GET(request: NextRequest) {
  const domain = request.nextUrl.searchParams.get("domain")?.trim();
  if (!domain) {
    return NextResponse.json(
      { error: "Missing required query parameter: domain" },
      { status: 400 }
    );
  }

  const page = Math.max(1, parseInt(request.nextUrl.searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(request.nextUrl.searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT)
  );
  const view = (request.nextUrl.searchParams.get("view") ?? "all") as ViewType;
  const offset = (page - 1) * limit;

  try {
    const baseWhere = eq(urlPerformanceMetrics.domain, domain);

    let orderBy =
      view === "top_performers"
        ? [desc(urlPerformanceMetrics.citationCount)]
        : view === "opportunity"
          ? [desc(urlPerformanceMetrics.citationCount), desc(urlPerformanceMetrics.avgPosition)]
          : [desc(urlPerformanceMetrics.citationCount)];

    const where =
      view === "opportunity"
        ? and(
            baseWhere,
            gt(urlPerformanceMetrics.avgPosition, 3),
            isNotNull(urlPerformanceMetrics.avgPosition)
          )
        : baseWhere;

    const [rows, countResult] = await Promise.all([
      db
        .select()
        .from(urlPerformanceMetrics)
        .where(where)
        .orderBy(...orderBy)
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(urlPerformanceMetrics)
        .where(where),
    ]);

    const total = countResult[0]?.count ?? 0;

    const urlSet = new Set(rows.map((r) => r.normalizedUrl));
    const canonicalRows =
      urlSet.size > 0
        ? await db
            .select({ fromUrl: urlCanonicalMapping.fromUrl, toUrl: urlCanonicalMapping.toUrl })
            .from(urlCanonicalMapping)
            .where(inArray(urlCanonicalMapping.fromUrl, Array.from(urlSet)))
        : [];

    const canonicalByFrom = new Map(canonicalRows.map((r) => [r.fromUrl, r.toUrl]));

    const pages = rows.map((r) => ({
      url: r.normalizedUrl,
      domain: r.domain,
      citationCount: r.citationCount,
      uniqueQueryCount: r.uniqueQueryCount,
      avgPosition: r.avgPosition != null ? Math.round(r.avgPosition * 100) / 100 : null,
      lastCitedAt: r.lastCitedAt ?? null,
      computedAt: r.computedAt,
      canonicalUrl: canonicalByFrom.get(r.normalizedUrl) ?? null,
    }));

    return NextResponse.json({
      domain,
      view,
      pages,
      total,
      page,
      limit,
    });
  } catch (err) {
    console.error("Pages API failed:", err);
    return NextResponse.json(
      {
        error: "Failed to load pages",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
