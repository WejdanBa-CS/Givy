/** Canonical public site. Keep Render as a legacy alias until DNS cuts over fully. */
export const CANONICAL_HOST = "www.givy.gifts";
export const CANONICAL_SITE_URL = `https://${CANONICAL_HOST}`;

const LEGACY_HOSTS = [
  "givy.gifts",
  "givy.onrender.com",
  "www.givy.onrender.com",
] as const;

export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (raw) return raw;
  return CANONICAL_SITE_URL;
}

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1"]);

function hostnameOf(host: string): string {
  return host.split(":")[0]?.toLowerCase() ?? "";
}

function portOf(host: string, fallback = ""): string {
  const i = host.lastIndexOf(":");
  if (i <= 0) return fallback;
  return host.slice(i + 1);
}

/** Render binds Next on :10000; that host must never appear in a Location header. */
function isRenderInternalHost(host: string, urlPort = ""): boolean {
  if (!LOOPBACK_HOSTS.has(hostnameOf(host))) return false;
  return portOf(host, urlPort) === "10000";
}

/**
 * Origin for user-facing redirects. Render’s `request.url` is often
 * `https://localhost:10000` (internal bind). Never send browsers there.
 */
export function publicRequestOrigin(request: Request): string {
  const nextUrl =
    "nextUrl" in request && (request as { nextUrl?: URL }).nextUrl instanceof URL
      ? (request as { nextUrl: URL }).nextUrl
      : new URL(request.url);

  const forwardedHost = request.headers
    .get("x-forwarded-host")
    ?.split(",")[0]
    ?.trim();
  const hostHeader = request.headers.get("host")?.split(",")[0]?.trim();
  const proto =
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
    nextUrl.protocol.replace(":", "") ||
    "https";

  const publicHost = [forwardedHost, hostHeader, nextUrl.host].find(
    (h) => h && !isRenderInternalHost(h, nextUrl.port),
  );

  if (!publicHost) return siteUrl();

  try {
    const origin = new URL(`${proto}://${publicHost}`).origin;
    if (siteOriginSet().has(origin)) return origin;
  } catch {
    /* ignore */
  }

  if (LOOPBACK_HOSTS.has(hostnameOf(publicHost))) {
    return `http://${publicHost}`;
  }

  return siteUrl();
}

export function siteOriginSet(): Set<string> {
  const set = new Set<string>([
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:10000",
    "http://127.0.0.1:10000",
    CANONICAL_SITE_URL,
    "https://givy.gifts",
    "https://givy.onrender.com",
  ]);
  try {
    set.add(new URL(siteUrl()).origin);
  } catch {
    /* ignore */
  }
  return set;
}

export function isLegacyPublicHost(host: string | null | undefined): boolean {
  if (!host) return false;
  const h = host.split(":")[0]?.toLowerCase() ?? "";
  return (LEGACY_HOSTS as readonly string[]).includes(h);
}

export function dollarsToMinor(amount: number): number {
  return Math.round(amount * 100);
}

export function minorToDollars(amountMinor: number): number {
  return amountMinor / 100;
}

export function formatMinor(
  amountMinor: number | null | undefined,
  currency = "USD",
): string {
  if (amountMinor == null || Number.isNaN(amountMinor)) return "—";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(minorToDollars(amountMinor));
}

export function mapFundingRpcError(message: string): Error {
  if (/could not find the function|schema cache/i.test(message)) {
    return new Error(
      "Group funding isn’t available on this server yet. Ask the host to apply migration 011_group_funding.sql.",
    );
  }
  return new Error(message);
}
