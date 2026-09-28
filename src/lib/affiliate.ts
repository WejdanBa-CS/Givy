import { safeHttpsUrl } from "@/lib/security";

/** Skimlinks publisher id from env (same value the client script uses). */
export function skimlinksPublisherId(): string | null {
  const id = process.env.NEXT_PUBLIC_SKIMLINKS_PUBLISHER_ID?.trim();
  return id || null;
}

export function skimlinksEnabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_SKIMLINKS_ENABLED?.trim().toLowerCase() === "true" &&
    Boolean(skimlinksPublisherId())
  );
}

/**
 * Reserved for a future server-side affiliate hop once Skimlinks is approved.
 * Currently returns the merchant URL unchanged — wrapping through
 * go.redirectingat.com caused browsers to download instead of opening shops.
 */
export function affiliateOutboundUrl(
  destination: string,
  _pageUrl?: string | null,
): string {
  return safeHttpsUrl(destination) ?? destination;
}
