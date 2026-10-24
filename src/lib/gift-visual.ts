const HTTPS_HINT = /^https:\/\//i;

/** True when a gift's image hint is a real https photo URL. */
export function isGiftImageUrl(hint?: string | null): boolean {
  if (!hint) return false;
  return HTTPS_HINT.test(hint.trim());
}
