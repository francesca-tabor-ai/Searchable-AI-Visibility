/**
 * Populates competitor_metrics for all domains that have citations.
 * Run: npm run script:competitors-refresh
 * Requires DATABASE_URL in .env or .env.local.
 */
import "./load-env";
import { refreshCompetitorMetrics } from "@/lib/competitors/refresh";

async function main() {
  console.log("Refreshing competitor_metrics for all domains with citations...");
  const results = await refreshCompetitorMetrics();
  for (const r of results) {
    console.log(`  ${r.targetDomain}: ${r.competitors} competitors`);
  }
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
