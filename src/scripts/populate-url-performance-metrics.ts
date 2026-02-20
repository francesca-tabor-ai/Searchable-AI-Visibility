/**
 * Populates url_performance_metrics from citations.
 * Run: npm run script:url-metrics  (or npx tsx src/scripts/populate-url-performance-metrics.ts)
 * Requires DATABASE_URL.
 */
import {
  fetchCitationPositions,
  aggregateUrlMetrics,
  upsertUrlPerformanceMetrics,
} from "@/lib/url-performance/aggregate";

async function main() {
  console.log("Fetching citation positions...");
  const rows = await fetchCitationPositions();
  console.log(`Got ${rows.length} citation rows`);

  const metrics = aggregateUrlMetrics(rows);
  console.log(`Aggregated to ${metrics.length} unique normalized URLs`);

  await upsertUrlPerformanceMetrics(metrics);
  console.log("Upserted url_performance_metrics.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
