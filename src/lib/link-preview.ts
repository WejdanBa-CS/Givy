import { safeHttpsUrl } from "@/lib/security";

const FETCH_TIMEOUT_MS = 5_500;
const MAX_BYTES = 900_000;

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
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)) {
    const parts = host.split(".").map(Number);
    const [a, b] = parts;
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
  }
  if (host.includes(":")) return true;
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

function linkRelImage(html: string): string | null {
  const match = html.match(
    /<link[^>]+rel=["'](?:image_src|thumbnail)["'][^>]+href=["']([^"']+)["']/i,
  );
  return match?.[1]?.trim() ?? null;
}

function itemPropImage(html: string): string | null {
  const patterns = [
    /<meta[^>]+itemprop=["']image["'][^>]+content=["']([^"']+)["']/i,
    /<img[^>]+itemprop=["']image["'][^>]+src=["']([^"']+)["']/i,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return null;
}

/** Best-effort Product / ImageObject URL from JSON-LD blocks. */
function jsonLdImage(html: string): string | null {
  const blocks = html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );
  for (const block of blocks) {
    const raw = block[1]?.trim();
    if (!raw) continue;
    try {
      const data: unknown = JSON.parse(raw);
      const found = pickImageFromJsonLd(data);
      if (found) return found;
    } catch {
      /* ignore malformed JSON-LD */
    }
  }
  return null;
}

function pickImageFromJsonLd(node: unknown, depth = 0): string | null {
  if (node == null || depth > 6) return null;
  if (typeof node === "string") {
    if (/^https:\/\//i.test(node) && /\.(jpe?g|png|webp|gif)(\?|$)/i.test(node)) {
      return node;
    }
    return null;
  }
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = pickImageFromJsonLd(item, depth + 1);
      if (found) return found;
    }
    return null;
  }
  if (typeof node !== "object") return null;
  const obj = node as Record<string, unknown>;
  const type = obj["@type"];
  const typeStr = Array.isArray(type) ? type.join(" ") : String(type ?? "");
  const looksProduct = /Product|Offer|ImageObject/i.test(typeStr);

  const image = obj.image ?? obj.thumbnailUrl ?? obj.contentUrl;
  if (typeof image === "string" && /^https:\/\//i.test(image)) return image;
  if (Array.isArray(image)) {
    for (const entry of image) {
      if (typeof entry === "string" && /^https:\/\//i.test(entry)) return entry;
      const nested = pickImageFromJsonLd(entry, depth + 1);
      if (nested) return nested;
    }
  } else if (image && typeof image === "object") {
    const nested = pickImageFromJsonLd(image, depth + 1);
    if (nested) return nested;
  }

  if (looksProduct || obj["@graph"] || obj.mainEntity) {
    for (const key of ["@graph", "mainEntity", "offers", "itemListElement"]) {
      const found = pickImageFromJsonLd(obj[key], depth + 1);
      if (found) return found;
    }
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

/** Best-effort Open Graph / Twitter / JSON-LD image from a product page (server only). */
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
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        // Browser-like UA — many shops block bare bots and omit OG tags.
        "User-Agent":
          "Mozilla/5.0 (compatible; GivyLinkPreview/1.1; +https://www.givy.gifts) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      },
    });
    if (!res.ok) return { imageUrl: null, title: null };
    const type = res.headers.get("content-type") ?? "";
    if (!/text\/html|application\/xhtml\+xml/i.test(type)) {
      return { imageUrl: null, title: null };
    }
    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_BYTES) {
      // Still try the truncated head — OG tags are usually early.
    }
    const slice = buf.byteLength > MAX_BYTES ? buf.slice(0, MAX_BYTES) : buf;
    const html = new TextDecoder("utf-8", { fatal: false }).decode(slice);
    const imageRaw =
      metaContent(html, "og:image") ||
      metaContent(html, "og:image:secure_url") ||
      metaContent(html, "og:image:url") ||
      metaContent(html, "twitter:image") ||
      metaContent(html, "twitter:image:src") ||
      jsonLdImage(html) ||
      linkRelImage(html) ||
      itemPropImage(html);
    const titleRaw =
      metaContent(html, "og:title") ||
      metaContent(html, "twitter:title") ||
      html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ||
      null;
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
