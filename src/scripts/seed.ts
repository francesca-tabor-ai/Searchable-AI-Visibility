/**
 * Seed the database with sample queries, responses, citations, and visibility scores.
 * Run: npm run db:seed  (or npx tsx src/scripts/seed.ts)
 * Requires DATABASE_URL in .env or .env.local.
 */
import "./load-env";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  queries,
  responses,
  citations,
  domainVisibilityScores,
  domainVisibilityScoreHistory,
} from "@/db/schema";

const SEED_QUERIES = [
  { text: "best running shoes 2024" },
  { text: "top project management tools" },
  { text: "how to learn TypeScript" },
  { text: "best CRM for small business" },
  { text: "running shoes for flat feet" },
];

const SEED_RESPONSES: { model: string; rawText: string; citationDomains: { url: string; domain: string }[] }[] = [
  {
    model: "gpt-4",
    rawText: "Top picks: 1. [Nike Pegasus](https://www.nike.com/pegasus) 2. [Adidas Ultraboost](https://www.adidas.com/ultraboost) 3. [Brooks Ghost](https://www.brooksrunning.com/ghost).",
    citationDomains: [
      { url: "https://www.nike.com/pegasus", domain: "nike.com" },
      { url: "https://www.adidas.com/ultraboost", domain: "adidas.com" },
      { url: "https://www.brooksrunning.com/ghost", domain: "brooksrunning.com" },
    ],
  },
  {
    model: "claude-3",
    rawText: "See Asana (https://asana.com), Monday (https://monday.com), and Notion (https://notion.so) for project management.",
    citationDomains: [
      { url: "https://asana.com", domain: "asana.com" },
      { url: "https://monday.com", domain: "monday.com" },
      { url: "https://notion.so", domain: "notion.so" },
    ],
  },
  {
    model: "gpt-4",
    rawText: "TypeScript docs: https://www.typescriptlang.org/docs. Also check [MDN](https://developer.mozilla.org) and [Stack Overflow](https://stackoverflow.com).",
    citationDomains: [
      { url: "https://www.typescriptlang.org/docs", domain: "typescriptlang.org" },
      { url: "https://developer.mozilla.org", domain: "developer.mozilla.org" },
      { url: "https://stackoverflow.com", domain: "stackoverflow.com" },
    ],
  },
  {
    model: "gpt-4",
    rawText: "Popular CRMs: HubSpot (https://hubspot.com), Salesforce (https://salesforce.com), Zoho (https://zoho.com).",
    citationDomains: [
      { url: "https://hubspot.com", domain: "hubspot.com" },
      { url: "https://salesforce.com", domain: "salesforce.com" },
      { url: "https://zoho.com", domain: "zoho.com" },
    ],
  },
  {
    model: "claude-3",
    rawText: "For flat feet try Brooks (https://www.brooksrunning.com) and Asics (https://www.asics.com). Nike has options too: https://www.nike.com/insoles.",
    citationDomains: [
      { url: "https://www.brooksrunning.com", domain: "brooksrunning.com" },
      { url: "https://www.asics.com", domain: "asics.com" },
      { url: "https://www.nike.com/insoles", domain: "nike.com" },
    ],
  },
];

const SEED_VISIBILITY_SCORES = [
  { domain: "nike.com", score: 72.5, previousScore: 68.2, change: 4.3 },
  { domain: "adidas.com", score: 65.0, previousScore: 66.1, change: -1.1 },
  { domain: "brooksrunning.com", score: 58.3, previousScore: 55.0, change: 3.3 },
  { domain: "asana.com", score: 81.2, previousScore: 79.0, change: 2.2 },
  { domain: "notion.so", score: 78.0, previousScore: 78.0, change: 0 },
  { domain: "typescriptlang.org", score: 90.1, previousScore: 88.5, change: 1.6 },
  { domain: "hubspot.com", score: 85.0, previousScore: 84.0, change: 1.0 },
];

async function seed() {
  if (!process.env.DATABASE_URL?.trim()) {
    console.error(
      "DATABASE_URL is not set. Add a line to .env or .env.local in the project root:\n  DATABASE_URL=postgresql://user:password@host:port/dbname?sslmode=require\nNo spaces around =. Run from project root: npm run db:seed"
    );
    process.exit(1);
  }
  console.log("Seeding database...");

  const now = new Date();

  // 1. Get or create queries (by unique text)
  const queryRows: { id: string; text: string }[] = [];
  for (const q of SEED_QUERIES) {
    const existing = await db.select().from(queries).where(eq(queries.text, q.text)).limit(1);
    if (existing[0]) {
      queryRows.push({ id: existing[0].id, text: existing[0].text });
    } else {
      const [inserted] = await db
        .insert(queries)
        .values({ text: q.text, createdAt: now })
        .returning({ id: queries.id, text: queries.text });
      if (!inserted) throw new Error(`Failed to insert query: ${q.text}`);
      queryRows.push(inserted);
    }
  }
  console.log(`Queries: ${queryRows.length} ready`);

  // 2. Insert responses and citations
  let responseCount = 0;
  let citationCount = 0;
  for (let i = 0; i < Math.min(queryRows.length, SEED_RESPONSES.length); i++) {
    const { id: queryId } = queryRows[i];
    const res = SEED_RESPONSES[i];

    const [resp] = await db
      .insert(responses)
      .values({
        queryId,
        model: res.model,
        rawText: res.rawText,
        createdAt: now,
      })
      .returning({ id: responses.id });

    if (resp) {
      responseCount++;
      for (const c of res.citationDomains) {
        await db.insert(citations).values({
          responseId: resp.id,
          queryId,
          url: c.url,
          domain: c.domain,
          createdAt: now,
        });
        citationCount++;
      }
    }
  }
  console.log(`Responses: ${responseCount}, Citations: ${citationCount}`);

  // 3. Upsert domain visibility scores (for dashboard)
  for (const row of SEED_VISIBILITY_SCORES) {
    await db
      .insert(domainVisibilityScores)
      .values({
        domain: row.domain,
        score: row.score,
        previousScore: row.previousScore,
        change: row.change,
        computedAt: now,
      })
      .onConflictDoUpdate({
        target: domainVisibilityScores.domain,
        set: {
          score: row.score,
          previousScore: row.previousScore,
          change: row.change,
          computedAt: now,
        },
      });
  }
  console.log(`Domain visibility scores: ${SEED_VISIBILITY_SCORES.length} upserted`);

  // 4. Insert history rows for sparklines (last 7 days for a few domains)
  const historyDomains = ["nike.com", "asana.com", "typescriptlang.org"];
  for (const domain of historyDomains) {
    const baseScore = SEED_VISIBILITY_SCORES.find((s) => s.domain === domain)?.score ?? 70;
    for (let d = 0; d < 7; d++) {
      const day = new Date(now);
      day.setDate(day.getDate() - d);
      await db.insert(domainVisibilityScoreHistory).values({
        domain,
        score: baseScore - d * 0.5 + Math.random() * 2,
        computedAt: day,
      });
    }
  }
  console.log(`Visibility score history: ${historyDomains.length * 7} rows`);

  console.log("Seed complete.");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
