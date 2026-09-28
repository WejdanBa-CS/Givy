import { safeHttpsUrl } from "@/lib/security";

/** Skimlinks publisher id from env (same value the client script uses). */
export function skimlinksPublisherId(): string | null {
  const id = process.env.NEXT_PUBLIC_SKIMLINKS_PUBLISHER_ID?.trim();
  return id || null;
}

/**
 * Wrap a merchant URL in Skimlinks' custom redirect so server-side hops
 * (e.g. `/go/[itemId]`) still earn commission. Returns the original URL
 * when the publisher id is unset or the destination is not https.
 */
export function affiliateOutboundUrl(
  destination: string,
  pageUrl?: string | null,
): string {
  const dest = safeHttpsUrl(destination);
  if (!dest) return destination;

  const publisherId = skimlinksPublisherId();
  if (!publisherId) return dest;

  const params = new URLSearchParams({
    id: publisherId,
    url: dest,
    xs: "1",
  });
  const sref = pageUrl ? safeHttpsUrl(pageUrl) : null;
  if (sref) params.set("sref", sref);

  return `https://go.redirectingat.com/?${params.toString()}`;
}
