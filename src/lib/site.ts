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
