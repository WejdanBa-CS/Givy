import Script from "next/script";

/**
 * Optional Skimlinks sitewide rewriter.
 *
 * Requires BOTH:
 * - NEXT_PUBLIC_SKIMLINKS_PUBLISHER_ID (from Skimlinks install)
 * - NEXT_PUBLIC_SKIMLINKS_ENABLED=true
 *
 * Leave disabled until the publisher domain is approved. A bad/unapproved
 * install rewrites shop links into broken redirects that browsers download.
 */
export function Skimlinks() {
  const enabled =
    process.env.NEXT_PUBLIC_SKIMLINKS_ENABLED?.trim().toLowerCase() === "true";
  const publisherId = process.env.NEXT_PUBLIC_SKIMLINKS_PUBLISHER_ID?.trim();
  if (!enabled || !publisherId) return null;

  return (
    <Script
      id="skimlinks"
      src={`https://s.skimresources.com/js/${publisherId}.skimlinks.js`}
      strategy="afterInteractive"
    />
  );
}
