import { safeHttpsUrl } from "@/lib/security";

const FETCH_TIMEOUT_MS = 4_500;
const MAX_BYTES = 512_000;

function isPrivateHostname(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    return true;
  }
  // Block obvious IPv4 private / loopback / link-local ranges by string form.
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)) {
    const parts = host.split(".").map(Number);
    const [a, b] = parts;
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
  }
  if (host.includes(":")) return true; // skip raw IPv6
  return false;
}

function metaContent(html: string, key: string): string | null {
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']+)["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${key}["']`,
      "i",
    ),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return null;
}

function absoluteUrl(base: string, maybeRelative: string): string | null {
  try {
    return new URL(maybeRelative, base).toString();
  } catch {
    return null;
  }
}

export type LinkPreview = {
  imageUrl: string | null;
  title: string | null;
};

/** Best-effort Open Graph / Twitter image from a product page (server only). */
export async function fetchLinkPreview(rawUrl: string): Promise<LinkPreview> {
  const url = safeHttpsUrl(rawUrl);
  if (!url) return { imageUrl: null, title: null };

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { imageUrl: null, title: null };
  }
  if (isPrivateHostname(parsed.hostname)) {
    return { imageUrl: null, title: null };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "GivyLinkPreview/1.0 (+https://www.givy.gifts)",
      },
    });
    if (!res.ok) return { imageUrl: null, title: null };
    const type = res.headers.get("content-type") ?? "";
    if (!/text\/html|application\/xhtml\+xml/i.test(type)) {
      return { imageUrl: null, title: null };
    }
    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_BYTES) {
      return { imageUrl: null, title: null };
    }
    const html = new TextDecoder("utf-8", { fatal: false }).decode(buf);
    const imageRaw =
      metaContent(html, "og:image") ||
      metaContent(html, "og:image:url") ||
      metaContent(html, "twitter:image") ||
      metaContent(html, "twitter:image:src");
    const titleRaw =
      metaContent(html, "og:title") ||
      metaContent(html, "twitter:title");
    const imageAbs = imageRaw ? absoluteUrl(url, imageRaw) : null;
    const imageUrl = imageAbs ? safeHttpsUrl(imageAbs) : null;
    return {
      imageUrl,
      title: titleRaw ? titleRaw.slice(0, 120) : null,
    };
  } catch {
    return { imageUrl: null, title: null };
  } finally {
    clearTimeout(timer);
  }
}
