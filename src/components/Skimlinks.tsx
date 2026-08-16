import Script from "next/script";

/**
 * Skimlinks site-wide link affiliate rewriter.
 * Set NEXT_PUBLIC_SKIMLINKS_PUBLISHER_ID on Render (e.g. 307683X1795970).
 * Leave unset to skip loading (local / no affiliate).
 */
export function Skimlinks() {
  const publisherId = process.env.NEXT_PUBLIC_SKIMLINKS_PUBLISHER_ID?.trim();
  if (!publisherId) return null;

  return (
    <Script
      id="skimlinks"
      src={`https://s.skimresources.com/js/${publisherId}.skimlinks.js`}
      strategy="afterInteractive"
    />
  );
}
