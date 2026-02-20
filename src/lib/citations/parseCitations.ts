import { normalizeUrl, normalizeDomain, UrlNormalizationError } from "@/lib/url/normalizeDomain";

export type ExtractedCitation = {
  url: string;
  domain: string;
};

export class CitationParseError extends Error {
  constructor(
    message: string,
    public readonly partial: ExtractedCitation[],
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "CitationParseError";
  }
}

/** Inline markdown link: [text](https://example.com) or [text](http://example.com) */
const INLINE_LINK_REGEX = /\[([^\]]*)\]\(\s*(https?:\/\/[^\s)]+)\s*\)/gi;

/** Reference-style lines: "1. https://example.com" or "1. https://..." */
const REFERENCE_LINE_REGEX = /^\s*\d+[.)]\s*(https?:\/\/[^\s]+)/gim;

/** Text-based citations: (example.com) or (https://example.com) or "see example.com" */
const TEXT_CITATION_REGEX = /(?:https?:\/\/)?(?:[\w-]+\.)+[\w-]+(?:\/[^\s)*\]"]*)?/gi;

/**
 * Parses raw AI response text and extracts citation URLs.
 * Handles:
 * - Inline links: [Source](https://example.com)
 * - Reference sections: 1. https://example.com
 * - Text-based citations: According to Example (example.com) or (https://example.com)
 * Returns normalized URLs and domains; skips malformed URLs and deduplicates by URL.
 */
export function parseCitations(rawText: string): ExtractedCitation[] {
  const seen = new Set<string>();
  const results: ExtractedCitation[] = [];

  function add(urlRaw: string): void {
    const normalized = urlRaw.trim();
    if (!normalized) return;
    try {
      const url = normalizeUrl(normalized);
      if (seen.has(url)) return;
      seen.add(url);
      const domain = normalizeDomain(url);
      results.push({ url, domain });
    } catch {
      // Skip malformed URLs
    }
  }

  // 1. Inline markdown links
  let m: RegExpExecArray | null;
  INLINE_LINK_REGEX.lastIndex = 0;
  while ((m = INLINE_LINK_REGEX.exec(rawText)) !== null) {
    add(m[2]);
  }

  // 2. Reference-style numbered lines (e.g. "1. https://...")
  REFERENCE_LINE_REGEX.lastIndex = 0;
  while ((m = REFERENCE_LINE_REGEX.exec(rawText)) !== null) {
    add(m[1]);
  }

  // 3. Text-based: (domain.com) or (https://domain.com) or bare domain/path
  const possibleUrls = rawText.match(TEXT_CITATION_REGEX) ?? [];
  for (const raw of possibleUrls) {
    const withScheme = raw.startsWith("http") ? raw : `https://${raw}`;
    add(withScheme);
  }

  return results;
}
