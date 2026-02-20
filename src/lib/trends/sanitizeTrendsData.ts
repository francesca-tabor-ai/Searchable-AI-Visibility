/**
 * Sanitizes trends API response for safe chart rendering.
 * Filters invalid points, sorts by date, ensures numeric values.
 * Returns status so UI can show "ok", "empty", or "error" state.
 */

export type SanitizedSeriesPoint = {
  date: string;
  score: number | null;
  scoreCompetitor1: number | null;
  scoreCompetitor2: number | null;
  citationCount: number;
};

export type SanitizedTrendsData = {
  domain: string;
  range: string;
  summary: {
    currentVisibility: number;
    change30d: number | null;
    peakScore: number;
  };
  domains: {
    target: string;
    competitor1: string | null;
    competitor2: string | null;
  };
  series: SanitizedSeriesPoint[];
};

function isValidDate(s: unknown): s is string {
  if (typeof s !== "string") return false;
  const d = new Date(s);
  return !Number.isNaN(d.getTime());
}

function toNumber(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

export type SanitizeResult =
  | { status: "ok"; data: SanitizedTrendsData }
  | { status: "empty"; data: SanitizedTrendsData }
  | { status: "error"; error: string };

export function sanitizeTrendsData(raw: unknown): SanitizeResult {
  try {
    if (raw == null || typeof raw !== "object") {
      return { status: "error", error: "Invalid response: not an object" };
    }

    const obj = raw as Record<string, unknown>;
    const domain = typeof obj.domain === "string" ? obj.domain : "";
    const range = typeof obj.range === "string" ? obj.range : "30d";

    if (!domain) {
      return { status: "error", error: "Missing domain" };
    }

    const summaryObj = obj.summary as Record<string, unknown> | undefined;
    const summary = {
      currentVisibility: toNumber(summaryObj?.currentVisibility) ?? 0,
      change30d: toNumber(summaryObj?.change30d) ?? null,
      peakScore: toNumber(summaryObj?.peakScore) ?? 0,
    };

    const domainsObj = obj.domains as Record<string, unknown> | undefined;
    const domains = {
      target: domain,
      competitor1: typeof domainsObj?.competitor1 === "string" ? domainsObj.competitor1 : null,
      competitor2: typeof domainsObj?.competitor2 === "string" ? domainsObj.competitor2 : null,
    };

    const rawSeries = Array.isArray(obj.series) ? obj.series : [];
    const series: SanitizedSeriesPoint[] = [];

    for (const item of rawSeries) {
      if (item == null || typeof item !== "object") continue;
      const row = item as Record<string, unknown>;
      const date = typeof row.date === "string" ? row.date : "";
      if (!date || !isValidDate(date)) continue;

      const score = toNumber(row.score);
      const scoreCompetitor1 = toNumber(row.scoreCompetitor1);
      const scoreCompetitor2 = toNumber(row.scoreCompetitor2);
      const citationCount = toNumber(row.citationCount) ?? 0;

      series.push({
        date,
        score,
        scoreCompetitor1,
        scoreCompetitor2,
        citationCount: Math.max(0, citationCount),
      });
    }

    series.sort((a, b) => a.date.localeCompare(b.date));

    const data: SanitizedTrendsData = {
      domain,
      range,
      summary,
      domains,
      series,
    };

    if (series.length === 0) {
      return { status: "empty", data };
    }
    return { status: "ok", data };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return { status: "error", error: message };
  }
}
