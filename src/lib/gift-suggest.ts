import type { Occasion } from "@/lib/types";
import { OCCASION_LABELS } from "@/lib/types";

export type GiftSuggestion = {
  title: string;
  notes?: string;
  priceHint?: number;
  why?: string;
};

export type SuggestInput = {
  occasion: Occasion;
  interests: string;
  budgetMax?: number;
  count: number;
};

export type SuggestResult = {
  suggestions: GiftSuggestion[];
  source: "ai" | "fallback";
};

const OCCASIONS = new Set<string>(Object.keys(OCCASION_LABELS));

export const SUGGEST_LIMITS = {
  interestsMax: 280,
  countMin: 3,
  countMax: 8,
  budgetMaxCap: 50_000,
  titleMax: 80,
  notesMax: 160,
  whyMax: 120,
  rateWindowMs: 60_000,
  rateMaxPerWindow: 8,
} as const;

/** Strip tags / control chars; keep plain text only. */
export function plainText(raw: unknown, maxLen: number): string {
  if (typeof raw !== "string") return "";
  return raw
    .replace(/<[^>]*>/g, " ")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);
}

export function isOccasion(value: unknown): value is Occasion {
  return typeof value === "string" && OCCASIONS.has(value);
}

export function parseSuggestBody(body: unknown): SuggestInput | { error: string } {
  if (!body || typeof body !== "object") {
    return { error: "Invalid JSON body" };
  }
  const raw = body as Record<string, unknown>;

  const occasion: Occasion = isOccasion(raw.occasion) ? raw.occasion : "other";
  const interests = plainText(raw.interests, SUGGEST_LIMITS.interestsMax);

  let count = SUGGEST_LIMITS.countMin;
  if (typeof raw.count === "number" && Number.isFinite(raw.count)) {
    count = Math.round(raw.count);
  }
  count = Math.min(
    SUGGEST_LIMITS.countMax,
    Math.max(SUGGEST_LIMITS.countMin, count),
  );

  let budgetMax: number | undefined;
  if (raw.budgetMax != null && raw.budgetMax !== "") {
    const n =
      typeof raw.budgetMax === "number"
        ? raw.budgetMax
        : Number(String(raw.budgetMax));
    if (!Number.isFinite(n) || n < 0) {
      return { error: "budgetMax must be a non-negative number" };
    }
    budgetMax = Math.min(SUGGEST_LIMITS.budgetMaxCap, Math.round(n));
  }

  return { occasion, interests, budgetMax, count };
}

export function sanitizeSuggestion(raw: unknown): GiftSuggestion | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const title = plainText(row.title, SUGGEST_LIMITS.titleMax);
  if (title.length < 2) return null;

  const notes = plainText(row.notes, SUGGEST_LIMITS.notesMax) || undefined;
  const why = plainText(row.why, SUGGEST_LIMITS.whyMax) || undefined;

  let priceHint: number | undefined;
  if (row.priceHint != null && row.priceHint !== "") {
    const n =
      typeof row.priceHint === "number"
        ? row.priceHint
        : Number(String(row.priceHint));
    if (Number.isFinite(n) && n >= 0 && n <= SUGGEST_LIMITS.budgetMaxCap) {
      priceHint = Math.round(n);
    }
  }

  return { title, notes, priceHint, why };
}

export function sanitizeSuggestions(
  list: unknown,
  count: number,
): GiftSuggestion[] {
  if (!Array.isArray(list)) return [];
  const out: GiftSuggestion[] = [];
  const seen = new Set<string>();
  for (const item of list) {
    const clean = sanitizeSuggestion(item);
    if (!clean) continue;
    const key = clean.title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(clean);
    if (out.length >= count) break;
  }
  return out;
}

const CURATED: Record<Occasion, GiftSuggestion[]> = {
  birthday: [
    {
      title: "Personalized star map print",
      notes: "Night sky from a meaningful date",
      priceHint: 45,
      why: "Keepsake with a story",
    },
    {
      title: "Small-batch coffee tasting set",
      notes: "Three origin bags + tasting card",
      priceHint: 38,
      why: "Everyday ritual upgrade",
    },
    {
      title: "Compact travel journal + fountain pen",
      notes: "Softcover, A6 size",
      priceHint: 42,
      why: "Quiet creative gift",
    },
    {
      title: "Indoor herb grow kit",
      notes: "Basil, mint, and chives",
      priceHint: 32,
      why: "Useful and a little playful",
    },
    {
      title: "Wireless earbuds case in leather",
      notes: "Monogram optional",
      priceHint: 28,
      why: "Practical everyday accessory",
    },
    {
      title: "Board-game night duo pack",
      notes: "Two quick 20-minute games",
      priceHint: 55,
      why: "Shared experience over stuff",
    },
  ],
  wedding: [
    {
      title: "Linen table runner set",
      notes: "Natural flax, washable",
      priceHint: 60,
      why: "Home they will actually use",
    },
    {
      title: "Couples cooking class voucher",
      notes: "Local studio or online kit",
      priceHint: 120,
      why: "Memory over more registry clutter",
    },
    {
      title: "Artisan cheese + honey board kit",
      notes: "Ready for a quiet evening in",
      priceHint: 48,
      why: "Celebrate without another appliance",
    },
    {
      title: "Framed first-home map print",
      notes: "Neighborhood they just moved to",
      priceHint: 55,
      why: "Personal and displayable",
    },
    {
      title: "Quality kitchen towel + soap set",
      notes: "Elevated everyday linens",
      priceHint: 35,
      why: "Registry gap filler that feels thoughtful",
    },
    {
      title: "Weekend picnic backpack",
      notes: "Blankets and utensils included",
      priceHint: 75,
      why: "Date-night ready",
    },
  ],
  holiday: [
    {
      title: "Spiced cocoa + mug duo",
      notes: "Ceramic mugs with mix sachets",
      priceHint: 36,
      why: "Cozy without being generic",
    },
    {
      title: "Wool throw in a deep color",
      notes: "Not white — forest or rust",
      priceHint: 68,
      why: "Useful through winter",
    },
    {
      title: "Ornament they can hang every year",
      notes: "Hand-blown or ceramic, dated",
      priceHint: 24,
      why: "Tradition starter",
    },
    {
      title: "Puzzle of a favorite city skyline",
      notes: "500–1000 pieces",
      priceHint: 30,
      why: "Quiet holiday afternoon activity",
    },
    {
      title: "Candle trio with seasonal scents",
      notes: "Soy wax, travel tins",
      priceHint: 40,
      why: "Atmosphere gift",
    },
    {
      title: "Hot toddy / mulled wine spice kit",
      notes: "Reusable spice sachets",
      priceHint: 22,
      why: "Entertaining-ready",
    },
  ],
  baby: [
    {
      title: "Organic swaddle set (3)",
      notes: "Breathable muslin, neutral tones",
      priceHint: 45,
      why: "Parents always need more",
    },
    {
      title: "White-noise travel machine",
      notes: "Compact, USB-C",
      priceHint: 40,
      why: "Sleep helper on the go",
    },
    {
      title: "Board book bundle (favorites)",
      notes: "3 sturdy classics",
      priceHint: 28,
      why: "Screen-free bonding",
    },
    {
      title: "Meal-train grocery gift card",
      notes: "Local market or delivery service",
      priceHint: 75,
      why: "Practical kindness",
    },
    {
      title: "Soft knit lovey + teether set",
      notes: "Machine washable",
      priceHint: 32,
      why: "Daily comfort item",
    },
    {
      title: "Parent care kit",
      notes: "Lip balm, hand cream, eye mask",
      priceHint: 35,
      why: "Gift for the grown-ups too",
    },
  ],
  graduation: [
    {
      title: "Leather folio for interviews",
      notes: "Slim padfolio with card slots",
      priceHint: 55,
      why: "Career-ready without flash",
    },
    {
      title: "Noise-cancelling over-ears (budget)",
      notes: "Solid mid-range model",
      priceHint: 89,
      why: "Study / commute upgrade",
    },
    {
      title: "Desk plant + ceramic planter",
      notes: "Low-light friendly",
      priceHint: 30,
      why: "First apartment energy",
    },
    {
      title: "Quality pen + notebook set",
      notes: "Refillable ink",
      priceHint: 42,
      why: "Classic milestone gift",
    },
    {
      title: "City discovery day pass",
      notes: "Museum or transit day ticket",
      priceHint: 50,
      why: "Celebrate with an outing",
    },
    {
      title: "Portable power bank (high capacity)",
      notes: "USB-C PD",
      priceHint: 45,
      why: "Useful from day one",
    },
  ],
  creator: [
    {
      title: "Softbox lighting kit (desk size)",
      notes: "Daylight bulbs included",
      priceHint: 65,
      why: "Instant production upgrade",
    },
    {
      title: "Shotgun mic for phone / camera",
      notes: "With deadcat windscreen",
      priceHint: 79,
      why: "Audio matters more than gear flex",
    },
    {
      title: "Color-calibrated monitor hood",
      notes: "Fits 24–27″ screens",
      priceHint: 38,
      why: "Editing comfort",
    },
    {
      title: "Cable management + desk mat set",
      notes: "Felt mat + adhesive clips",
      priceHint: 34,
      why: "Cleaner setup on camera",
    },
    {
      title: "Thumbnail / brand style swatch book",
      notes: "Printed color references",
      priceHint: 28,
      why: "Creative workflow gift",
    },
    {
      title: "Portable SSD (1TB)",
      notes: "USB-C, bus powered",
      priceHint: 95,
      why: "Storage always fills up",
    },
  ],
  other: [
    {
      title: "Unexpected bookstore gift card",
      notes: "Independent shop if possible",
      priceHint: 40,
      why: "Lets them choose the joy",
    },
    {
      title: "Weekend hiking daypack",
      notes: "Lightweight, water bottle pocket",
      priceHint: 58,
      why: "Adventure-ready",
    },
    {
      title: "Ceramic pour-over set",
      notes: "Dripper + two cups",
      priceHint: 48,
      why: "Morning ritual upgrade",
    },
    {
      title: "Vinyl of a shared favorite album",
      notes: "Or a rediscovered classic",
      priceHint: 35,
      why: "Nostalgia with presence",
    },
    {
      title: "Quality socks + candle pairing",
      notes: "Not boring — bold pattern + scent",
      priceHint: 32,
      why: "Small but considered",
    },
    {
      title: "Experience: pottery or painting night",
      notes: "Local studio voucher",
      priceHint: 70,
      why: "Memory over more shelf clutter",
    },
  ],
};

function interestTokens(interests: string): string[] {
  return interests
    .toLowerCase()
    .split(/[^a-z0-9+#]+/i)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3);
}

/** Score curated ideas against free-text interests for a lightly personal mix. */
function scoreAgainstInterests(s: GiftSuggestion, tokens: string[]): number {
  if (tokens.length === 0) return 0;
  const hay = `${s.title} ${s.notes ?? ""} ${s.why ?? ""}`.toLowerCase();
  let score = 0;
  for (const t of tokens) {
    if (hay.includes(t)) score += 2;
  }
  return score;
}

export function curatedSuggestions(input: SuggestInput): GiftSuggestion[] {
  const pool = [...CURATED[input.occasion]];
  const tokens = interestTokens(input.interests);

  // Light interest-aware extras when keywords appear.
  const extras: GiftSuggestion[] = [];
  const joined = tokens.join(" ");
  if (/cook|chef|kitchen|food|bake/.test(joined)) {
    extras.push({
      title: "Chef’s knife sharpener + board oil",
      notes: "Maintenance kit for serious cooking",
      priceHint: 36,
      why: "Matches a kitchen interest",
    });
  }
  if (/read|book|novel|lit/.test(joined)) {
    extras.push({
      title: "Book light + page tabs set",
      notes: "For late-night chapters",
      priceHint: 26,
      why: "Reader-friendly",
    });
  }
  if (/hike|outdoor|camp|trail|nature/.test(joined)) {
    extras.push({
      title: "Insulated trail bottle (32 oz)",
      notes: "Leak-proof, wide mouth",
      priceHint: 40,
      why: "Outdoor-ready",
    });
  }
  if (/game|play|steam|switch|rpg/.test(joined)) {
    extras.push({
      title: "Co-op board game for two",
      notes: "Under 45 minutes per play",
      priceHint: 45,
      why: "Playtime without a screen",
    });
  }
  if (/music|vinyl|guitar|piano|band/.test(joined)) {
    extras.push({
      title: "Concert tote + earplug set",
      notes: "For the next live show",
      priceHint: 28,
      why: "Music-night companion",
    });
  }
  if (/plant|garden|green|botany/.test(joined)) {
    extras.push({
      title: "Unusual houseplant + care card",
      notes: "Skip the supermarket orchid",
      priceHint: 35,
      why: "Plant-person approved",
    });
  }

  const combined = [...extras, ...pool];
  combined.sort(
    (a, b) =>
      scoreAgainstInterests(b, tokens) - scoreAgainstInterests(a, tokens),
  );

  let filtered = combined;
  if (input.budgetMax != null) {
    const under = combined.filter(
      (s) => s.priceHint == null || s.priceHint <= input.budgetMax!,
    );
    if (under.length >= input.count) filtered = under;
  }

  return sanitizeSuggestions(filtered, input.count);
}

function buildPrompt(input: SuggestInput): string {
  const occasionLabel = OCCASION_LABELS[input.occasion];
  const budget =
    input.budgetMax != null
      ? `Prefer ideas around or under $${input.budgetMax}.`
      : "Include a mix of price points.";
  const interests = input.interests
    ? `Recipient interests / context: ${input.interests}`
    : "No specific interests given — lean creative but practical.";

  return [
    `Suggest ${input.count} unique, thoughtful gift ideas for a ${occasionLabel}.`,
    interests,
    budget,
    "Avoid generic gift cards unless truly fitting. Prefer specific, buyable ideas.",
    "Return ONLY valid JSON: {\"suggestions\":[{\"title\":\"...\",\"notes\":\"...\",\"priceHint\":0,\"why\":\"...\"}]}",
    "priceHint is approximate USD integer. notes and why are short plain text.",
  ].join("\n");
}

async function callOpenAiCompatible(
  input: SuggestInput,
): Promise<GiftSuggestion[] | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  const base = (
    process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1"
  ).replace(/\/$/, "");
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);

  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        temperature: 0.85,
        max_tokens: 900,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are a gift stylist for Givy, a wishlist app. Reply with JSON only. Never include HTML or markdown.",
          },
          { role: "user", content: buildPrompt(input) },
        ],
      }),
    });

    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      return null;
    }

    const list =
      parsed &&
      typeof parsed === "object" &&
      Array.isArray((parsed as { suggestions?: unknown }).suggestions)
        ? (parsed as { suggestions: unknown }).suggestions
        : parsed;

    const clean = sanitizeSuggestions(list, input.count);
    return clean.length > 0 ? clean : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function suggestGifts(input: SuggestInput): Promise<SuggestResult> {
  const ai = await callOpenAiCompatible(input);
  if (ai && ai.length > 0) {
    return { suggestions: ai, source: "ai" };
  }
  return { suggestions: curatedSuggestions(input), source: "fallback" };
}

/** Simple sliding-window rate limit (per-process; fine for MVP). */
const rateBuckets = new Map<string, number[]>();

export function allowSuggestRequest(key: string): boolean {
  const now = Date.now();
  const windowMs = SUGGEST_LIMITS.rateWindowMs;
  const prev = rateBuckets.get(key) ?? [];
  const recent = prev.filter((t) => now - t < windowMs);
  if (recent.length >= SUGGEST_LIMITS.rateMaxPerWindow) {
    rateBuckets.set(key, recent);
    return false;
  }
  recent.push(now);
  rateBuckets.set(key, recent);
  return true;
}
