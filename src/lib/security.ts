/** Security helpers used by auth redirects and outbound links. */

export function safeNextPath(
  next: string | null | undefined,
  fallback = "/app",
): string {
  if (!next) return fallback;
  const trimmed = next.trim();
  if (!trimmed.startsWith("/")) return fallback;
  if (trimmed.startsWith("//")) return fallback;
  if (trimmed.includes("://")) return fallback;
  if (trimmed.includes("\\")) return fallback;
  if (trimmed.includes("@")) return fallback;
  return trimmed;
}

const BLOCKED_PROTOCOLS = /^(javascript|data|vbscript|file):/i;

/** Field length caps (mirrored in migration 008). */
export const FIELD_LIMITS = {
  displayName: 80,
  listTitle: 120,
  itemTitle: 120,
  notes: 2000,
  description: 2000,
  recipientAddress: 500,
  url: 2048,
} as const;

/** Only allow http(s) absolute URLs for product / support links. */
export function safeHttpUrl(
  raw: string | null | undefined,
): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed || BLOCKED_PROTOCOLS.test(trimmed)) return null;
  if (trimmed.length > FIELD_LIMITS.url) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

/** Gift / image writes: https only (cleartext http rejected). */
export function safeHttpsUrl(
  raw: string | null | undefined,
): string | null {
  const http = safeHttpUrl(raw);
  if (!http) return null;
  if (!http.toLowerCase().startsWith("https://")) return null;
  return http;
}

const SUPPORT_HOSTS = new Set([
  "paypal.com",
  "www.paypal.com",
  "paypal.me",
  "www.paypal.me",
  "www.paypalobjects.com",
  "ko-fi.com",
  "www.ko-fi.com",
  "buymeacoffee.com",
  "www.buymeacoffee.com",
]);

function hostAllowed(hostname: string, allowlist: Set<string>) {
  const host = hostname.toLowerCase();
  if (allowlist.has(host)) return true;
  return [...allowlist].some(
    (allowed) => host === allowed || host.endsWith(`.${allowed}`),
  );
}

/** Support / tip links: https only, known tip hosts (PayPal, Ko-fi, etc.). */
export function safeSupportUrl(raw: string | null | undefined): string | null {
  const http = safeHttpUrl(raw);
  if (!http) return null;
  const url = new URL(http);
  if (url.protocol !== "https:") return null;
  if (!hostAllowed(url.hostname, SUPPORT_HOSTS)) return null;
  return url.toString();
}

/** Normalize a PayPal.me handle or URL into a canonical https tip link. */
export function paypalMeUrl(handleOrUrl: string): string | null {
  const trimmed = handleOrUrl.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return safeSupportUrl(trimmed);

  const handle = trimmed
    .replace(/^@/, "")
    .replace(/^paypal\.me\//i, "")
    .replace(/^https?:\/\/(www\.)?paypal\.me\//i, "");
  if (!/^[a-zA-Z0-9._-]{3,64}$/.test(handle)) return null;
  return `https://www.paypal.com/paypalme/${handle}`;
}

export function isPaypalSupportUrl(raw: string | null | undefined): boolean {
  const url = safeSupportUrl(raw);
  if (!url) return false;
  const host = new URL(url).hostname.toLowerCase();
  return host === "paypal.com" || host.endsWith(".paypal.com") || host.includes("paypal.me");
}

/** Closed-beta invite codes: letters, numbers, hyphens only. */
export function normalizeInviteCode(
  raw: string | null | undefined,
): string | null {
  if (!raw) return null;
  let trimmed = raw.trim();
  try {
    trimmed = decodeURIComponent(trimmed).trim();
  } catch {
    return null;
  }
  if (!/^[A-Za-z0-9-]{4,64}$/.test(trimmed)) return null;
  return trimmed;
}

/** Path or absolute URL for a shareable beta invite link. */
export function inviteLinkPath(
  code: string,
  siteUrl?: string | null,
): string | null {
  const normalized = normalizeInviteCode(code);
  if (!normalized) return null;
  const path = `/invite/${encodeURIComponent(normalized)}`;
  const base = siteUrl?.trim().replace(/\/$/, "");
  return base ? `${base}${path}` : path;
}

const CLOUD_ITEM_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Supabase gift ids are UUIDs; local demo ids look like `gift_…`. */
export function isCloudItemId(id: string | null | undefined): boolean {
  return Boolean(id && CLOUD_ITEM_ID.test(id));
}

/**
 * Cloud gifts go through `/go` so the buy URL stays on the server.
 * Local demo lists open the saved http(s) URL directly.
 */
export function shopHref(item: {
  id: string;
  url?: string | null;
}): string | null {
  if (isCloudItemId(item.id)) return `/go/${item.id}`;
  return safeHttpUrl(item.url);
}
