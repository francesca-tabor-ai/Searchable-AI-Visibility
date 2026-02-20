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
// Trim so trailing newline/carriage return from .env doesn't break pg URL parsing
const url = raw.trim();

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url,
    // Railway's public proxy uses a cert that may be self-signed; allow for local/drizzle-kit
    ssl: { rejectUnauthorized: false },
  },
});
