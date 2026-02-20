import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { db } from "@/db";
import {
  domainVisibilityScores,
  queries,
  citations,
} from "@/db/schema";
import { desc, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

type Message = { role: "user" | "assistant" | "system"; content: string };

async function getDataContext(): Promise<string> {
  try {
    const [scores, queryCount, citationCount] = await Promise.all([
      db
        .select({
          domain: domainVisibilityScores.domain,
          score: domainVisibilityScores.score,
          change: domainVisibilityScores.change,
        })
        .from(domainVisibilityScores)
        .orderBy(desc(domainVisibilityScores.score))
        .limit(20),
      db.select({ count: sql<number>`count(*)::int` }).from(queries),
      db.select({ count: sql<number>`count(*)::int` }).from(citations),
    ]);

    const totalQueries = queryCount[0]?.count ?? 0;
    const totalCitations = citationCount[0]?.count ?? 0;
    const topDomains = scores
      .map((s) => `${s.domain}: score ${Number(s.score).toFixed(2)}${s.change != null ? ` (change ${Number(s.change).toFixed(2)})` : ""}`)
      .join("\n");

    return [
      "Current data snapshot (use for questions about numbers):",
      `- Total tracked queries: ${totalQueries}`,
      `- Total citations: ${totalCitations}`,
      "- Top domains by visibility score (up to 20):",
      topDomains || "(none yet)",
    ].join("\n");
  } catch {
    return "Database is not available or not configured. Answer questions about the app and suggest setting up the database for data-specific questions.";
  }
}

const SYSTEM_PROMPT = `You are a helpful assistant for Searchable — an AI Search Visibility platform. Users track which sources (URLs) AI models (e.g. ChatGPT, Claude) cite for given queries. You help users understand the app and their data.

The app includes:
- Dashboard: visibility scores per domain, trends over time, content/URL leaderboards, competitor overlap and share of voice.
- Data model: queries (user questions), responses (AI model output per query), citations (extracted URLs per response), domain_visibility_scores (computed daily), competitor_metrics, url_performance_metrics, url_health_check.
- API: POST /api/ingest to ingest raw AI response text; it extracts citations and stores query, response, and citations. Cron jobs compute visibility scores and competitor metrics.

When the user asks about "my data", "how many", "top domains", "scores", etc., use the data context provided below. Be concise and accurate. If data is empty, say so and suggest running the visibility-score worker or ingesting data via /api/ingest.`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured. Add it to .env.local." },
      { status: 503 }
    );
  }

  let body: { messages?: Message[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const messages = body.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: "Body must include messages array with at least one message" },
      { status: 400 }
    );
  }

  const dataContext = await getDataContext();
  const openai = new OpenAI({ apiKey });
  const systemContent = `${SYSTEM_PROMPT}\n\n${dataContext}`;

  const apiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemContent },
    ...messages.map((m) => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
    })),
  ];

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: apiMessages,
      max_tokens: 1024,
      temperature: 0.4,
    });

    const choice = completion.choices[0];
    const content = choice?.message?.content?.trim() ?? "I couldn’t generate a response. Please try again.";
    return NextResponse.json({ message: { role: "assistant" as const, content } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Chat API error:", err);
    return NextResponse.json(
      { error: "Chat request failed", details: message },
      { status: 500 }
    );
  }
}
