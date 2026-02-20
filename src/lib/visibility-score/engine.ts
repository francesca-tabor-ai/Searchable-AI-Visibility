import Big from "big.js";
import type { DomainAggregationRow } from "./aggregation";

/** Weights for final formula: share, coverage, position, recency */
const WEIGHTS = {
  share: new Big(0.4),
  coverage: new Big(0.3),
  position: new Big(0.2),
  recency: new Big(0.1),
} as const;

const ZERO = new Big(0);
const ONE = new Big(1);
const TEN = new Big(10);
const HUNDRED = new Big(100);

/**
 * position_score = 1 - (avg_position - 1) / 10, capped at 0.
 */
function positionScore(avgPosition: number | null): Big {
  if (avgPosition == null || Number.isNaN(avgPosition)) return ZERO;
  const pos = new Big(avgPosition);
  const raw = ONE.minus(pos.minus(1).div(TEN));
  return raw.lt(0) ? ZERO : raw;
}

/**
 * Normalize recency weight sum to 0-1 using max across domains.
 */
function recencyScore(recencyWeightSum: number, maxRecency: Big): Big {
  if (maxRecency.eq(0)) return ZERO;
  const w = new Big(recencyWeightSum);
  const s = w.div(maxRecency);
  return s.gt(1) ? ONE : s;
}

export type DomainScoreResult = {
  domain: string;
  score: number;
  previousScore: number | null;
  change: number | null;
};

/**
 * Compute Searchable Visibility Score™ per domain.
 * Formula: 100 * (0.4 * share + 0.3 * coverage + 0.2 * position_score + 0.1 * recency_score)
 * Robust against zero-division; uses Big.js for precise decimals.
 */
export function computeScores(
  rows: DomainAggregationRow[],
  previousScores: Map<string, number>
): DomainScoreResult[] {
  if (rows.length === 0) return [];

  const totalCitations = new Big(rows[0].totalCitations);
  const totalQueries = new Big(rows[0].totalQueries);

  const hasCitations = totalCitations.gt(0);
  const hasQueries = totalQueries.gt(0);

  let maxRecency = ZERO;
  for (const r of rows) {
    const w = new Big(r.recencyWeightSum);
    if (w.gt(maxRecency)) maxRecency = w;
  }

  const results: DomainScoreResult[] = [];

  for (const r of rows) {
    const citationShare = !hasCitations
      ? ZERO
      : new Big(r.domainCitationCount).div(totalCitations);

    const queryCoverage = !hasQueries
      ? ZERO
      : new Big(r.distinctQueries).div(totalQueries);

    const posScore = positionScore(r.avgPosition);
    const recScore = recencyScore(r.recencyWeightSum, maxRecency);

    const weighted =
      citationShare.mul(WEIGHTS.share)
        .add(queryCoverage.mul(WEIGHTS.coverage))
        .add(posScore.mul(WEIGHTS.position))
        .add(recScore.mul(WEIGHTS.recency));

    const score = weighted.mul(HUNDRED).round(4).toNumber();
    const prev = previousScores.get(r.domain) ?? null;
    const change = prev !== null ? Number((new Big(score).minus(prev).round(4).toNumber())) : null;

    results.push({
      domain: r.domain,
      score,
      previousScore: prev,
      change,
    });
  }

  return results;
}
