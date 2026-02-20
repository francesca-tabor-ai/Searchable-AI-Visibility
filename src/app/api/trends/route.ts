import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  domainVisibilityScores,
  domainVisibilityScoreHistory,
  competitorMetrics,
} from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

const RANGE_DAYS: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };

type HistoryRow = { domain: string; day: string; score_smooth: number };
type CitationRow = { day: string; citation_count: number };

/**
 * GET /api/trends?domain=target.com&range=30d
 * Returns daily visibility score (7-day rolling average) and citation counts for the target and top 2 competitors.
 * summary: currentVisibility, change30d, peakScore.
 */
export async function GET(request: NextRequest) {
  const domain = request.nextUrl.searchParams.get("domain")?.trim();
  const rangeParam = request.nextUrl.searchParams.get("range")?.trim() || "30d";
  const days = RANGE_DAYS[rangeParam] ?? 30;

  if (!domain) {
    return NextResponse.json(
      { error: "Missing required query parameter: domain" },
      { status: 400 }
    );
  }

  try {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const currentScoreRow = await db
      .select()
      .from(domainVisibilityScores)
      .where(eq(domainVisibilityScores.domain, domain))
      .limit(1);

    const topCompetitors = await db
      .select({ competitorDomain: competitorMetrics.competitorDomain })
      .from(competitorMetrics)
      .where(eq(competitorMetrics.targetDomain, domain))
      .orderBy(asc(competitorMetrics.competitorRank))
      .limit(2);

    const competitorDomains = topCompetitors.map((r) => r.competitorDomain);
    const domainsToFetch = [domain, ...competitorDomains];

    const historyResult = await db.execute(sql`
      WITH daily AS (
        SELECT
          domain,
          (computed_at AT TIME ZONE 'UTC')::date AS day,
          (array_agg(score ORDER BY computed_at DESC))[1]::double precision AS score
        FROM domain_visibility_score_history
        WHERE domain IN (${sql.join(domainsToFetch.map((d) => sql`${d}`), sql`, `)})
          AND computed_at >= ${since}
        GROUP BY domain, (computed_at AT TIME ZONE 'UTC')::date
      ),
      smoothed AS (
        SELECT
          domain,
          day,
          avg(score) OVER (PARTITION BY domain ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS score_smooth
        FROM daily
      )
      SELECT domain, day::text AS day, score_smooth
      FROM smoothed
      ORDER BY day
    `);

    const citationResult = await db.execute(sql`
      SELECT
        (created_at AT TIME ZONE 'UTC')::date::text AS day,
        count(*)::int AS citation_count
      FROM citations
      WHERE domain = ${domain}
        AND created_at >= ${since}
      GROUP BY (created_at AT TIME ZONE 'UTC')::date
      ORDER BY day
    `);

    const rawHistory = historyResult as unknown;
    const historyRows: HistoryRow[] = Array.isArray(rawHistory)
      ? (rawHistory as HistoryRow[])
      : (rawHistory as { rows?: HistoryRow[] }).rows ?? [];

    const rawCitation = citationResult as unknown;
    const citationRows: CitationRow[] = Array.isArray(rawCitation)
      ? (rawCitation as CitationRow[])
      : (rawCitation as { rows?: CitationRow[] }).rows ?? [];

    const citationByDay = new Map(citationRows.map((r) => [r.day, Number(r.citation_count)]));

    const scoreByDomainAndDay = new Map<string, Map<string, number>>();
    for (const r of historyRows) {
      const d = String(r.day).slice(0, 10);
      if (!scoreByDomainAndDay.has(r.domain)) {
        scoreByDomainAndDay.set(r.domain, new Map());
      }
      scoreByDomainAndDay.get(r.domain)!.set(d, Number(r.score_smooth));
    }

    const daySet = new Set<string>();
    Array.from(scoreByDomainAndDay.values()).forEach((m) => {
      Array.from(m.keys()).forEach((d) => daySet.add(d));
    });
    Array.from(citationByDay.keys()).forEach((d) => daySet.add(d));
    const sortedDays = Array.from(daySet).sort();

    const series = sortedDays.map((date) => ({
      date,
      score: scoreByDomainAndDay.get(domain)?.get(date) ?? null,
      scoreCompetitor1: competitorDomains[0]
        ? (scoreByDomainAndDay.get(competitorDomains[0])?.get(date) ?? null)
        : null,
      scoreCompetitor2: competitorDomains[1]
        ? (scoreByDomainAndDay.get(competitorDomains[1])?.get(date) ?? null)
        : null,
      citationCount: citationByDay.get(date) ?? 0,
    }));

    const currentVisibility =
      currentScoreRow[0]?.score != null ? Number(currentScoreRow[0].score) : null;
    const change30d =
      currentScoreRow[0]?.change != null ? Number(currentScoreRow[0].change) : null;
    const allScores = historyRows
      .filter((r) => r.domain === domain)
      .map((r) => Number(r.score_smooth));
    const peakScore =
      allScores.length > 0 ? Math.max(...allScores) : (currentVisibility ?? 0);

    return NextResponse.json({
      domain,
      range: rangeParam,
      summary: {
        currentVisibility: currentVisibility ?? 0,
        change30d: change30d ?? null,
        peakScore: Math.round(peakScore * 10) / 10,
      },
      domains: {
        target: domain,
        competitor1: competitorDomains[0] ?? null,
        competitor2: competitorDomains[1] ?? null,
      },
      series,
    });
  } catch (err) {
    console.error("Trends failed:", err);
    return NextResponse.json(
      {
        error: "Failed to load trends",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
