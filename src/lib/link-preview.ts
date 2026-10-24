import { safeHttpsUrl } from "@/lib/security";

const FETCH_TIMEOUT_MS = 7_000;
const MAX_BYTES = 2_000_000;

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

const URLISH = /^(?:https?:)?\/\//i;

/** Zoom / hi-res attributes that shops (Amazon, WooCommerce, Magento…) put on the main photo. */
function zoomAttrImage(html: string): string | null {
  const patterns = [
    /data-old-hires=["']([^"']+)["']/i,
    /"hiRes":"((?:https?:)?\/\/[^"]+)"/i,
    /data-a-dynamic-image=["']\{(?:&quot;|")((?:https?:)?\/\/[^&"]+)/i,
    /data-(?:zoom-image|zoom-src|large_image|large-image|full-image|hires|original)=["']([^"']+)["']/i,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]?.trim()) return match[1].trim();
  }
  return null;
}

const JUNK_IMAGE =
  /(?:^|[\W_])(?:logos?|icons?|favicon|sprites?|avatars?|badges?|banners?|flags?|pixel|spacer|blank|placeholder|loader|spinner|rating|stars?|payments?|social|captcha|tracking|1x1)(?:[\W_]|$)|\.svg(?:\?|$)|\.gif(?:\?|$)/i;
const PRODUCT_HINT = /product|main|hero|primary|gallery|zoom|featured|landing|detail|pdp|item/i;

function attr(tag: string, name: string): string | null {
  const match = tag.match(new RegExp(`\\s${name}=["']([^"']*)["']`, "i"));
  return match?.[1]?.trim() || null;
}

function largestFromSrcset(srcset: string | null): string | null {
  if (!srcset) return null;
  let best: { url: string; size: number } | null = null;
  for (const part of srcset.split(/,\s+/)) {
    const [url, descriptor] = part.trim().split(/\s+/);
    if (!url) continue;
    const size = Number.parseFloat(descriptor ?? "1") || 1;
    if (!best || size > best.size) best = { url, size };
  }
  return best?.url ?? null;
}

/** Last resort for any site: score every <img> and keep the likeliest product photo. */
function bestImgTag(html: string, title: string | null): string | null {
  const titleWords = new Set(
    (title ?? "")
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 3),
  );
  let best: { url: string; score: number } | null = null;
  let index = 0;
  for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = match[0];
    index += 1;
    const url =
      largestFromSrcset(attr(tag, "data-srcset") ?? attr(tag, "srcset")) ??
      attr(tag, "data-src") ??
      attr(tag, "data-lazy-src") ??
      attr(tag, "data-original") ??
      attr(tag, "src");
    if (!url || url.startsWith("data:")) continue;
    const labels = [attr(tag, "id"), attr(tag, "class"), attr(tag, "alt")].join(" ");
    if (JUNK_IMAGE.test(url) || JUNK_IMAGE.test(labels)) continue;

    const width = Number.parseInt(attr(tag, "width") ?? "", 10);
    const height = Number.parseInt(attr(tag, "height") ?? "", 10);
    if ((width && width < 120) || (height && height < 120)) continue;

    let score = 0;
    if (PRODUCT_HINT.test(labels)) score += 3;
    if (PRODUCT_HINT.test(url)) score += 1;
    if (width >= 400 || height >= 400) score += 2;
    const alt = (attr(tag, "alt") ?? "").toLowerCase();
    for (const word of titleWords) if (alt.includes(word)) score += 1;
    score -= Math.min(index, 40) * 0.05;
    if (!best || score > best.score) best = { url, score };
  }
  return best && best.score > 0 ? best.url : null;
}

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;|&#0*160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;|&apos;/gi, "'")
    .replace(/&#x2F;|&#0*47;/gi, "/")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

/** Absolute https image URL (upgrades http and //cdn links), or null. */
function normalizeImage(pageUrl: string, raw: string | null): string | null {
  if (!raw) return null;
  const decoded = decodeEntities(raw.trim());
  if (!decoded || decoded.startsWith("data:")) return null;
  const abs = absoluteUrl(pageUrl, decoded);
  if (!abs) return null;
  const upgraded = abs.replace(/^http:\/\//i, "https://");
  const safe = safeHttpsUrl(upgraded);
  if (!safe) return null;
  try {
    if (isPrivateHostname(new URL(safe).hostname)) return null;
  } catch {
    return null;
  }
  return safe;
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
    if (URLISH.test(node) && /\.(jpe?g|png|webp|avif)(\?|$)/i.test(node)) {
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

  const image = obj.image ?? obj.thumbnailUrl ?? obj.contentUrl ?? obj.url;
  if (typeof image === "string" && URLISH.test(image)) return image;
  if (Array.isArray(image)) {
    for (const entry of image) {
      if (typeof entry === "string" && URLISH.test(entry)) return entry;
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

  let title: string | null = null;
  for (const userAgent of USER_AGENTS) {
    const html = await fetchHtml(url, userAgent);
    if (!html) continue;
    const preview = extractPreview(url, html);
    title ??= preview.title;
    if (preview.imageUrl) return { imageUrl: preview.imageUrl, title };
  }
  return { imageUrl: null, title };
}

// Some shops only answer a named bot, others only a plain browser — try both.
const USER_AGENTS = [
  "Mozilla/5.0 (compatible; GivyLinkPreview/1.1; +https://www.givy.gifts) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
];

async function fetchHtml(url: string, userAgent: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "User-Agent": userAgent,
      },
    });
    if (!res.ok) return null;
    const type = res.headers.get("content-type") ?? "";
    if (!/text\/html|application\/xhtml\+xml/i.test(type)) return null;
    const buf = await res.arrayBuffer();
    const slice = buf.byteLength > MAX_BYTES ? buf.slice(0, MAX_BYTES) : buf;
    return new TextDecoder("utf-8", { fatal: false }).decode(slice);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function extractPreview(url: string, html: string): LinkPreview {
  const titleRaw =
    metaContent(html, "og:title") ||
    metaContent(html, "twitter:title") ||
    html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ||
    null;
  const title = titleRaw ? decodeEntities(titleRaw).replace(/\s+/g, " ").trim().slice(0, 120) || null : null;

  const candidates = [
    () => metaContent(html, "og:image:secure_url"),
    () => metaContent(html, "og:image"),
    () => metaContent(html, "og:image:url"),
    () => metaContent(html, "twitter:image"),
    () => metaContent(html, "twitter:image:src"),
    () => jsonLdImage(html),
    () => itemPropImage(html),
    () => zoomAttrImage(html),
    () => linkRelImage(html),
    () => bestImgTag(html, title),
  ];
  for (const candidate of candidates) {
    const imageUrl = normalizeImage(url, candidate());
    if (imageUrl) return { imageUrl, title };
  }
  return { imageUrl: null, title };
}
