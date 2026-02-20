import "dotenv/config";
import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load .env.local so Next.js env and db:push both see DATABASE_URL
config({ path: ".env.local" });

const url = process.env.DATABASE_URL;
if (!url?.trim()) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env and add your PostgreSQL connection string (e.g. from Neon or Railway)."
  );
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
});
