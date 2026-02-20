import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { queries, responses, citations } from "@/db/schema";
import { sql } from "drizzle-orm";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * Daily cron: optional cleanup or summary.
 * Secured by CRON_SECRET (Vercel sends Authorization: Bearer <CRON_SECRET>).
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [q] = await db.select({ count: sql<number>`count(*)::int` }).from(queries);
    const [r] = await db.select({ count: sql<number>`count(*)::int` }).from(responses);
    const [c] = await db.select({ count: sql<number>`count(*)::int` }).from(citations);

    const summary = {
      date: new Date().toISOString(),
      queries: q?.count ?? 0,
      responses: r?.count ?? 0,
      citations: c?.count ?? 0,
    };

    return NextResponse.json({ ok: true, summary });
  } catch (err) {
    console.error("Cron daily failed:", err);
    return NextResponse.json(
      { error: "Cron failed", details: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
