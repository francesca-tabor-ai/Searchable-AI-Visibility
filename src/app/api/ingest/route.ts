import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/edge";
import { queries, responses, citations } from "@/db/schema";
import { parseCitations } from "@/lib/citations/parseCitations";
import { eq } from "drizzle-orm";

export const runtime = "edge";

type IngestBody = {
  query: string;
  model: string;
  rawResponseText: string;
};

function isIngestBody(value: unknown): value is IngestBody {
  return (
    typeof value === "object" &&
    value !== null &&
    "query" in value &&
    "model" in value &&
    "rawResponseText" in value &&
    typeof (value as IngestBody).query === "string" &&
    typeof (value as IngestBody).model === "string" &&
    typeof (value as IngestBody).rawResponseText === "string"
  );
}

function randomId(): string {
  return crypto.randomUUID();
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (!isIngestBody(body)) {
    return NextResponse.json(
      { error: "Missing or invalid fields: query, model, rawResponseText (strings)" },
      { status: 400 }
    );
  }

  const { query: queryText, model, rawResponseText } = body;

  if (!queryText.trim() || !model.trim()) {
    return NextResponse.json(
      { error: "query and model must be non-empty" },
      { status: 400 }
    );
  }

  try {
    const extracted = parseCitations(rawResponseText);
    const now = new Date();
    const queryTextTrimmed = queryText.trim();

    const result = await db.transaction(async (tx) => {
      const existing = await tx.select().from(queries).where(eq(queries.text, queryTextTrimmed)).limit(1);
      let queryId = existing[0]?.id;
      if (!queryId) {
        queryId = randomId();
        await tx.insert(queries).values({
          id: queryId,
          text: queryTextTrimmed,
          createdAt: now,
        });
      }

      const responseId = randomId();
      await tx.insert(responses).values({
        id: responseId,
        queryId,
        model: model.trim(),
        rawText: rawResponseText,
        createdAt: now,
      });

      for (const { url, domain } of extracted) {
        try {
          await tx.insert(citations).values({
            id: randomId(),
            responseId,
            queryId,
            url,
            domain,
            createdAt: now,
          });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          const code = typeof err === "object" && err !== null && "code" in err ? (err as { code?: string }).code : undefined;
          const isUniqueViolation =
            code === "SQLITE_CONSTRAINT_UNIQUE" ||
            code === "23505" ||
            /UNIQUE|unique constraint/i.test(msg);
          if (!isUniqueViolation) throw err;
        }
      }

      return { queryId, responseId, citationCount: extracted.length };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error("Ingest failed:", err);
    return NextResponse.json(
      { error: "Ingest failed", details: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
