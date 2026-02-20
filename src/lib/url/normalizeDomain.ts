/**
 * Normalizes a URL to a canonical form:
 * - Uses https
 * - Strips www. subdomain for domain extraction
 * - Returns both full normalized URL and domain (e.g. "nike.com")
 */

export class UrlNormalizationError extends Error {
  constructor(
    message: string,
    public readonly input: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "UrlNormalizationError";
  }
}

/**
 * Extract and normalize domain from a URL string.
 * e.g. "https://www.nike.com/page" -> "nike.com"
 */
export function normalizeDomain(urlInput: string): string {
  const url = normalizeUrl(urlInput);
  try {
    const hostname = new URL(url).hostname;
    return stripWww(hostname);
  } catch {
    throw new UrlNormalizationError("Invalid URL for domain extraction", urlInput);
  }
}

export type NormalizeUrlOptions = {
  /**
   * Query param keys to keep (e.g. ["ref"]). By default all query params are removed.
   */
  keepQueryParams?: string[];
};

/**
 * Normalize URL: https, lowercase host + path, strip trailing slash, remove query params (unless kept).
 * Example: https://Nike.com/Running?utm=123/ -> https://nike.com/running
 */
export function normalizeUrl(urlInput: string, options?: NormalizeUrlOptions): string {
  const trimmed = urlInput.trim();
  if (!trimmed) {
    throw new UrlNormalizationError("Empty URL", urlInput);
  }

  let href: string;
  try {
    if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed)) {
      href = new URL(trimmed, "https://example.com").href;
      if (href.startsWith("https://example.com")) {
        href = "https://" + trimmed;
      }
    } else {
      href = new URL(trimmed).href;
    }
  } catch {
    throw new UrlNormalizationError("Malformed URL", urlInput);
  }

  try {
    const parsed = new URL(href);
    parsed.protocol = "https:";
    if (parsed.port === "443") parsed.port = "";

    const keepKeys = options?.keepQueryParams;
    if (keepKeys?.length) {
      const nextSearch = new URLSearchParams();
      for (const key of keepKeys) {
        const v = parsed.searchParams.get(key);
        if (v != null) nextSearch.set(key, v);
      }
      parsed.search = nextSearch.toString();
    } else {
      parsed.search = "";
    }

    const path = (parsed.pathname.replace(/\/+$/, "") || "/").toLowerCase();
    const host = parsed.hostname.toLowerCase();
    const origin = `https://${host}${parsed.port ? ":" + parsed.port : ""}`;
    const pathPart = path === "/" ? "" : path;
    const queryPart = parsed.search ? parsed.search : "";
    return `${origin}${pathPart}${queryPart}`;
  } catch {
    throw new UrlNormalizationError("Malformed URL", urlInput);
  }
}

function stripWww(hostname: string): string {
  return hostname.replace(/^www\./i, "");
}
