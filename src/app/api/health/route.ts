import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

type HealthStatus = "ok" | "degraded" | "error";

type HealthBody = {
  status: HealthStatus;
  timestamp: string;
  version: string;
  checks: {
    database: { status: "up" | "down"; latencyMs?: number; error?: string };
    redis?: { status: "up" | "down" | "skipped"; latencyMs?: number; error?: string };
  };
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const started = Date.now();
  const checks: HealthBody["checks"] = {
    database: { status: "down" },
  };

  try {
    const dbStart = Date.now();
    await db.execute(sql`SELECT 1`);
    checks.database = { status: "up", latencyMs: Date.now() - dbStart };
  } catch (err) {
    checks.database = {
      status: "down",
      error: err instanceof Error ? err.message : String(err),
    };
  }

  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    try {
      const redisStart = Date.now();
      const redis = await getRedisClient(redisUrl);
      await redis.ping();
      await redis.quit();
      checks.redis = { status: "up", latencyMs: Date.now() - redisStart };
    } catch (err) {
      checks.redis = {
        status: "down",
        error: err instanceof Error ? err.message : String(err),
      };
    }
  } else {
    checks.redis = { status: "skipped" };
  }

  const allCriticalUp = checks.database.status === "up";
  const degraded = checks.redis && checks.redis.status === "down";
  const status: HealthStatus = allCriticalUp ? (degraded ? "degraded" : "ok") : "error";

  const body: HealthBody = {
    status,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? "0.1.0",
    checks,
  };

  // Always return 200 so platform healthchecks pass (e.g. Railway).
  // Body reports status/checks so monitoring can still see DB/Redis state.
  return NextResponse.json(body, { status: 200 });
}

async function getRedisClient(
  url: string
): Promise<{ ping: () => Promise<string>; quit: () => Promise<void> }> {
  const Redis = (await import("ioredis")).default;
  const client = new Redis(url, { maxRetriesPerRequest: 1 });
  return {
    ping: () => client.ping(),
    quit: async () => { await client.quit(); },
  };
}
