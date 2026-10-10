/** Resolve a gift thumbnail: real https URL, named glyph seed, or title keywords. */

const HTTPS_HINT = /^https:\/\//i;

const KEYWORD_SEEDS: Array<{ seed: string; patterns: RegExp }> = [
  { seed: "hat", patterns: /\b(hat|beanie|cap|beret)\b/i },
  { seed: "socks", patterns: /\b(sock|socks)\b/i },
  { seed: "snacks", patterns: /\b(snack|candy|chocolate|coffee|tea|treat)\b/i },
  { seed: "watch", patterns: /\b(watch|timepiece)\b/i },
  { seed: "card", patterns: /\b(gift\s*card|voucher|certificate)\b/i },
  { seed: "bag", patterns: /\b(bag|tote|purse|backpack)\b/i },
  { seed: "mug", patterns: /\b(mug|cup|pour-?over|ceramic)\b/i },
  { seed: "cabin", patterns: /\b(cabin|stay|hotel|getaway|trip|travel)\b/i },
  { seed: "book", patterns: /\b(book|journal|notebook)\b/i },
  { seed: "plant", patterns: /\b(plant|herb|garden|flower)\b/i },
  { seed: "tech", patterns: /\b(earbud|headphone|speaker|gadget|charger)\b/i },
  { seed: "home", patterns: /\b(linen|towel|candle|frame|print|home)\b/i },
];

const KNOWN_SEEDS = new Set([
  "hat",
  "socks",
  "snacks",
  "watch",
  "card",
  "bag",
  "mug",
  "cabin",
  "book",
  "plant",
  "tech",
  "home",
  "default",
]);

export function isGiftImageUrl(hint?: string | null): boolean {
  if (!hint) return false;
  return HTTPS_HINT.test(hint.trim());
}

export function resolveGiftVisualSeed(
  title?: string | null,
  hint?: string | null,
): string {
  const trimmed = hint?.trim();
  if (trimmed && !isGiftImageUrl(trimmed)) {
    const seed = trimmed.toLowerCase().replace(/[^a-z0-9_-]/g, "");
    if (seed && KNOWN_SEEDS.has(seed)) return seed;
  }
  const text = title?.trim() ?? "";
  for (const entry of KEYWORD_SEEDS) {
    if (entry.patterns.test(text)) return entry.seed;
  }
  return "default";
}

/** Public path for a curated gift illustration (SVG under /public/gifts). */
export function giftIllustrationSrc(seed: string): string {
  const safe = KNOWN_SEEDS.has(seed) ? seed : "default";
  return `/gifts/${safe}.svg`;
}
