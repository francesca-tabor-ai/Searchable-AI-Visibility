import { db } from "@/db";
import { sql } from "drizzle-orm";
import { urlPerformanceMetrics } from "@/db/schema";
import { normalizeUrl } from "@/lib/url/normalizeDomain";

type Row = {
  url: string;
  domain: string;
  query_id: string;
  position: number;
  created_at: Date | string;
};

/**
 * Fetches all citations with per-response position, query_id, and created_at for URL aggregation.
 */
export async function fetchCitationPositions(): Promise<Row[]> {
  const result = await db.execute(sql`
    SELECT
      c.url,
      c.domain,
      r.query_id,
      c.created_at,
      row_number() OVER (PARTITION BY c.response_id ORDER BY c.created_at, c.id)::int AS position
    FROM citations c
    JOIN responses r ON r.id = c.response_id
  `);
  const raw = result as unknown;
  return (Array.isArray(raw) ? raw : (raw as { rows?: Row[] }).rows ?? []) as Row[];
}

export type UrlMetric = {
  normalizedUrl: string;
  domain: string;
  citationCount: number;
  uniqueQueryCount: number;
  avgPosition: number | null;
  lastCitedAt: Date | null;
};

/**
 * Aggregates citation positions into URL-level metrics using normalized URLs.
 * Merges rows that normalize to the same URL (e.g. with/without query params).
 * lastCitedAt = most recent citation time for that URL (decaying content signal).
 */
export function aggregateUrlMetrics(rows: Row[]): UrlMetric[] {
  const byKey = new Map<
    string,
    { domain: string; citations: number; queryIds: Set<string>; positionSum: number; lastCitedAt: Date | null }
  >();

  for (const r of rows) {
    let normalized: string;
    try {
      normalized = normalizeUrl(r.url);
    } catch {
      continue;
    }
    const citedAt = r.created_at ? new Date(r.created_at) : null;
    const key = normalized;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, {
        domain: r.domain,
        citations: 1,
        queryIds: new Set([r.query_id]),
        positionSum: r.position,
        lastCitedAt: citedAt,
      });
    } else {
      existing.citations += 1;
      existing.queryIds.add(r.query_id);
      existing.positionSum += r.position;
      if (citedAt && (!existing.lastCitedAt || citedAt > existing.lastCitedAt)) {
        existing.lastCitedAt = citedAt;
      }
    }
  }

  return Array.from(byKey.entries()).map(([normalizedUrl, v]) => ({
    normalizedUrl,
    domain: v.domain,
    citationCount: v.citations,
    uniqueQueryCount: v.queryIds.size,
    avgPosition: v.citations > 0 ? v.positionSum / v.citations : null,
    lastCitedAt: v.lastCitedAt,
  }));
}

const BATCH_SIZE = 200;

/**
 * Upserts url_performance_metrics with the given metrics and sets computed_at to now.
 */
export async function upsertUrlPerformanceMetrics(metrics: UrlMetric[]): Promise<void> {
  const now = new Date();
  for (let i = 0; i < metrics.length; i += BATCH_SIZE) {
    const batch = metrics.slice(i, i + BATCH_SIZE);
    for (const m of batch) {
      await db
        .insert(urlPerformanceMetrics)
        .values({
          normalizedUrl: m.normalizedUrl,
          domain: m.domain,
          citationCount: m.citationCount,
          uniqueQueryCount: m.uniqueQueryCount,
          avgPosition: m.avgPosition,
          lastCitedAt: m.lastCitedAt,
          computedAt: now,
        })
        .onConflictDoUpdate({
          target: urlPerformanceMetrics.normalizedUrl,
          set: {
            domain: m.domain,
            citationCount: m.citationCount,
            uniqueQueryCount: m.uniqueQueryCount,
            avgPosition: m.avgPosition,
            lastCitedAt: m.lastCitedAt,
            computedAt: now,
          },
        });
    }
  }
}
