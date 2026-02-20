import { db } from "@/db";
import { domainVisibilityScores } from "@/db/schema";
import { getDomainAggregations } from "./aggregation";
import { computeScores } from "./engine";

export type RunVisibilityScoreResult = {
  computed: number;
  at: Date;
};

/**
 * Runs the Searchable Visibility Score™ calculation: aggregate, score, upsert.
 * Uses the same DATABASE_URL as the app. Throws on error.
 */
export async function runVisibilityScoreCalculation(): Promise<RunVisibilityScoreResult> {
  const previousRows = await db.select().from(domainVisibilityScores);
  const previousScores = new Map<string, number>();
  for (const row of previousRows) {
    if (row.score != null) previousScores.set(row.domain, row.score);
  }

  const aggregations = await getDomainAggregations();
  const results = computeScores(aggregations, previousScores);

  const now = new Date();
  for (const r of results) {
    await db
      .insert(domainVisibilityScores)
      .values({
        domain: r.domain,
        score: r.score,
        previousScore: r.previousScore,
        change: r.change,
        computedAt: now,
      })
      .onConflictDoUpdate({
        target: domainVisibilityScores.domain,
        set: {
          score: r.score,
          previousScore: r.previousScore,
          change: r.change,
          computedAt: now,
        },
      });
  }

  return { computed: results.length, at: now };
}
