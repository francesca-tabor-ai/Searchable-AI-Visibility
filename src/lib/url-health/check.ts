import { db } from "@/db";
import { urlPerformanceMetrics, urlHealthCheck } from "@/db/schema";
import { desc } from "drizzle-orm";

const DEFAULT_TOP_N = 500;
const REQUEST_TIMEOUT_MS = 10_000;

/**
 * Fetches top N URLs by citation_count for health checks (uses B-tree index on domain, citation_count).
 */
export async function getTopUrlsToCheck(limit: number = DEFAULT_TOP_N): Promise<{ normalizedUrl: string }[]> {
  const rows = await db
    .select({ normalizedUrl: urlPerformanceMetrics.normalizedUrl })
    .from(urlPerformanceMetrics)
    .orderBy(desc(urlPerformanceMetrics.citationCount))
    .limit(limit);
  return rows;
}

/**
 * Pings a URL with HEAD; returns status code and whether it's considered ok (2xx or 3xx).
 */
export async function pingUrl(url: string): Promise<{ statusCode: number | null; isOk: boolean }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "Searchable-URL-Health/1.0" },
    });
    clearTimeout(timeout);
    const code = res.status;
    const isOk = code >= 200 && code < 400;
    return { statusCode: code, isOk };
  } catch {
    return { statusCode: null, isOk: false };
  }
}

/**
 * Runs health check for one URL and upserts into url_health_check.
 */
export async function checkAndStoreOne(url: string): Promise<void> {
  const { statusCode, isOk } = await pingUrl(url);
  const now = new Date();
  await db
    .insert(urlHealthCheck)
    .values({
      normalizedUrl: url,
      lastCheckedAt: now,
      statusCode,
      isOk: isOk ? 1 : 0,
    })
    .onConflictDoUpdate({
      target: urlHealthCheck.normalizedUrl,
      set: {
        lastCheckedAt: now,
        statusCode: statusCode ?? undefined,
        isOk: isOk ? 1 : 0,
      },
    });
}

/**
 * Runs health checks for top N URLs and stores results. Processes sequentially to avoid thundering herd.
 */
export async function runUrlHealthChecks(limit: number = DEFAULT_TOP_N): Promise<{ checked: number; ok: number; failed: number }> {
  const urls = await getTopUrlsToCheck(limit);
  let ok = 0;
  let failed = 0;
  for (const { normalizedUrl } of urls) {
    const { statusCode, isOk } = await pingUrl(normalizedUrl);
    const now = new Date();
    await db
      .insert(urlHealthCheck)
      .values({
        normalizedUrl,
        lastCheckedAt: now,
        statusCode: statusCode ?? null,
        isOk: isOk ? 1 : 0,
      })
      .onConflictDoUpdate({
        target: urlHealthCheck.normalizedUrl,
        set: {
          lastCheckedAt: now,
          statusCode: statusCode ?? null,
          isOk: isOk ? 1 : 0,
        },
      });
    if (isOk) ok++;
    else failed++;
  }
  return { checked: urls.length, ok, failed };
}
