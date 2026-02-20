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

/**
 * Normalize URL: ensure https and strip trailing slashes for consistency.
 * Does not change path; only scheme and basic validity.
 */
export function normalizeUrl(urlInput: string): string {
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
    return parsed.toString().replace(/\/$/, "") || parsed.origin;
  } catch {
    throw new UrlNormalizationError("Malformed URL", urlInput);
  }
}

function stripWww(hostname: string): string {
  return hostname.replace(/^www\./i, "");
}
