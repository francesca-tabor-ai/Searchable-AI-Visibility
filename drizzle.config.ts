import "dotenv/config";
import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load .env.local so Next.js env and db:push both see DATABASE_URL
config({ path: ".env.local" });

const raw = process.env.DATABASE_URL;
if (!raw?.trim()) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env and add your PostgreSQL connection string (e.g. from Neon or Railway)."
  );
}
const url = raw.trim();

// Parse URL so we can pass ssl explicitly (drizzle-kit/pg may ignore ssl when only url is set)
const parsed = new URL(url);
const isSecure = parsed.protocol === "postgresql:" || parsed.protocol === "postgres:";
const password = parsed.password ? decodeURIComponent(parsed.password) : undefined;

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    host: parsed.hostname,
    port: parsed.port ? parseInt(parsed.port, 10) : 5432,
    user: parsed.username || "postgres",
    password: password || undefined,
    database: parsed.pathname ? parsed.pathname.slice(1) : "railway",
    // Railway's public proxy uses a cert that may be self-signed; allow for local/drizzle-kit
    ssl: isSecure ? { rejectUnauthorized: false } : false,
  },
});
