import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { citations, responses } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get("domain")?.trim() ?? undefined;
  const model = searchParams.get("model")?.trim() ?? undefined;

  try {
    const baseQuery = db
      .select({
        id: citations.id,
        responseId: citations.responseId,
        url: citations.url,
        domain: citations.domain,
        createdAt: citations.createdAt,
        model: responses.model,
      })
      .from(citations)
      .innerJoin(responses, eq(citations.responseId, responses.id))
      .orderBy(desc(citations.createdAt));

    const rows =
      domain && model
        ? await baseQuery.where(and(eq(citations.domain, domain), eq(responses.model, model)))
        : domain
          ? await baseQuery.where(eq(citations.domain, domain))
          : model
            ? await baseQuery.where(eq(responses.model, model))
            : await baseQuery;
    return NextResponse.json({ citations: rows });
  } catch (err) {
    console.error("Citations list failed:", err);
    return NextResponse.json(
      { error: "Failed to list citations", details: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
