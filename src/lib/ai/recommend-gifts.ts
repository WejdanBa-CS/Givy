import type { Occasion } from "@/lib/types";
import { OCCASION_LABELS } from "@/lib/types";
import { plainText } from "@/lib/gift-suggest";

/** Shopper categories for the AI recommendation engine. */
export const GIFT_CATEGORIES = [
  "tech",
  "home",
  "fashion",
  "food",
  "experience",
  "wellness",
  "books",
  "kids",
  "outdoor",
  "other",
] as const;

export type GiftCategory = (typeof GIFT_CATEGORIES)[number];

export const GIFT_CATEGORY_LABELS: Record<GiftCategory, string> = {
  tech: "Tech & gadgets",
  home: "Home & living",
  fashion: "Fashion & accessories",
  food: "Food & drink",
  experience: "Experiences",
  wellness: "Wellness & self-care",
  books: "Books & stationery",
  kids: "Kids & baby",
  outdoor: "Outdoor & sport",
  other: "Other",
};

export type RecommendedGift = {
  title: string;
  short_description: string;
  estimated_price: number;
  search_keyword: string;
  /** Present when matched via search_gift_catalog */
  catalog_id?: string;
  affiliate_ready?: boolean;
};

export type RecommendInput = {
  category: GiftCategory;
  budget_min: number;
  budget_max: number;
  occasion: Occasion;
  count: number;
};

export type RecommendResult = {
  gifts: RecommendedGift[];
  source: "ai" | "catalog" | "fallback";
  catalog_hits: number;
  /** True when OPENAI_API_KEY is present on the server (never exposes the key). */
  openai_configured: boolean;
  /** Short reason when AI did not produce gifts (safe for clients). */
  openai_error?: string;
};

export const RECOMMEND_LIMITS = {
  countMin: 3,
  countMax: 8,
  budgetCap: 50_000,
  titleMax: 100,
  descriptionMax: 200,
  keywordMax: 80,
  rateWindowMs: 60_000,
  rateMaxPerWindow: 6,
} as const;

export type CatalogItem = {
  id: string;
  title: string;
  category: GiftCategory;
  price: number;
  search_keyword: string;
  blurb: string;
  /** Placeholder for future affiliate / merchant URL */
  product_url?: string;
};

/** Seed catalog — swap for DB / affiliate API later. */
export const GIFT_CATALOG: CatalogItem[] = [
  {
    id: "tech-earbuds",
    title: "Noise-cancelling wireless earbuds",
    category: "tech",
    price: 89,
    search_keyword: "wireless noise cancelling earbuds",
    blurb: "Daily-driver audio without the cable tangle.",
  },
  {
    id: "tech-charger",
    title: "Compact GaN USB-C charger (65W)",
    category: "tech",
    price: 42,
    search_keyword: "65W GaN USB-C charger",
    blurb: "One brick for laptop + phone on the go.",
  },
  {
    id: "tech-stand",
    title: "Adjustable aluminum laptop stand",
    category: "tech",
    price: 55,
    search_keyword: "aluminum laptop stand adjustable",
    blurb: "Clean desk posture upgrade.",
  },
  {
    id: "home-candle",
    title: "Soy candle 3-pack (seasonal scents)",
    category: "home",
    price: 36,
    search_keyword: "soy candle gift set 3 pack",
    blurb: "Warm ambience without synthetic overload.",
  },
  {
    id: "home-throw",
    title: "Chunky knit throw blanket",
    category: "home",
    price: 68,
    search_keyword: "chunky knit throw blanket",
    blurb: "Couch-ready comfort for slow evenings.",
  },
  {
    id: "home-mug",
    title: "Handmade ceramic mug set (2)",
    category: "home",
    price: 48,
    search_keyword: "handmade ceramic mug set of 2",
    blurb: "Artisan feel for morning coffee.",
  },
  {
    id: "fashion-scarf",
    title: "Merino wool scarf",
    category: "fashion",
    price: 58,
    search_keyword: "merino wool scarf unisex",
    blurb: "Lightweight warmth that looks intentional.",
  },
  {
    id: "fashion-bag",
    title: "Structured crossbody bag",
    category: "fashion",
    price: 95,
    search_keyword: "leather crossbody bag everyday",
    blurb: "Hands-free carry for city days.",
  },
  {
    id: "food-coffee",
    title: "Specialty coffee subscription (3 months)",
    category: "food",
    price: 72,
    search_keyword: "specialty coffee subscription 3 month",
    blurb: "Fresh beans without the guessing.",
  },
  {
    id: "food-olive",
    title: "Extra-virgin olive oil tasting trio",
    category: "food",
    price: 45,
    search_keyword: "olive oil tasting gift set",
    blurb: "Kitchen upgrade they will actually use.",
  },
  {
    id: "exp-class",
    title: "Local cooking class voucher",
    category: "experience",
    price: 85,
    search_keyword: "cooking class gift voucher near me",
    blurb: "A memory instead of more clutter.",
  },
  {
    id: "exp-spa",
    title: "Spa massage gift certificate",
    category: "experience",
    price: 120,
    search_keyword: "spa massage gift certificate",
    blurb: "Reset day, fully booked for them.",
  },
  {
    id: "well-diffuser",
    title: "Ultrasonic essential oil diffuser",
    category: "wellness",
    price: 40,
    search_keyword: "ultrasonic essential oil diffuser",
    blurb: "Calm evenings with a soft glow.",
  },
  {
    id: "well-mat",
    title: "Cork yoga mat + strap",
    category: "wellness",
    price: 78,
    search_keyword: "cork yoga mat with strap",
    blurb: "Grip that improves with practice.",
  },
  {
    id: "books-novel",
    title: "Hardcover novel + reading light",
    category: "books",
    price: 38,
    search_keyword: "hardcover bestseller and book light",
    blurb: "Tonight’s chapter, no squinting.",
  },
  {
    id: "books-journal",
    title: "Linen-bound journal + fountain pen",
    category: "books",
    price: 52,
    search_keyword: "linen journal fountain pen set",
    blurb: "For lists, sketches, and quiet thoughts.",
  },
  {
    id: "kids-blocks",
    title: "Wooden building block set",
    category: "kids",
    price: 44,
    search_keyword: "wooden building blocks toddler set",
    blurb: "Open-ended play that lasts years.",
  },
  {
    id: "kids-soft",
    title: "Organic cotton soft toy",
    category: "kids",
    price: 32,
    search_keyword: "organic cotton soft toy baby",
    blurb: "Soft, washable, gift-wrap ready.",
  },
  {
    id: "out-bottle",
    title: "Insulated trail bottle 32oz",
    category: "outdoor",
    price: 40,
    search_keyword: "insulated stainless water bottle 32oz",
    blurb: "Hikes and desk days covered.",
  },
  {
    id: "out-hammock",
    title: "Portable camping hammock",
    category: "outdoor",
    price: 65,
    search_keyword: "portable camping hammock with straps",
    blurb: "Shade + swing wherever trees allow.",
  },
  {
    id: "other-frame",
    title: "Custom photo print + frame",
    category: "other",
    price: 49,
    search_keyword: "custom photo print framed gift",
    blurb: "Personal without being cheesy.",
  },
  {
    id: "other-puzzle",
    title: "1000-piece art puzzle",
    category: "other",
    price: 28,
    search_keyword: "1000 piece art jigsaw puzzle",
    blurb: "Rainy-day table project.",
  },
];

export function isGiftCategory(value: unknown): value is GiftCategory {
  return (
    typeof value === "string" &&
    (GIFT_CATEGORIES as readonly string[]).includes(value)
  );
}

export function parseRecommendBody(
  body: unknown,
): RecommendInput | { error: string } {
  if (!body || typeof body !== "object") {
    return { error: "Invalid JSON body" };
  }
  const raw = body as Record<string, unknown>;

  if (!isGiftCategory(raw.category)) {
    return {
      error: `category must be one of: ${GIFT_CATEGORIES.join(", ")}`,
    };
  }

  const occasionKeys = Object.keys(OCCASION_LABELS);
  const occasion: Occasion =
    typeof raw.occasion === "string" && occasionKeys.includes(raw.occasion)
      ? (raw.occasion as Occasion)
      : "other";

  const minRaw =
    typeof raw.budget_min === "number"
      ? raw.budget_min
      : Number(raw.budget_min);
  const maxRaw =
    typeof raw.budget_max === "number"
      ? raw.budget_max
      : Number(raw.budget_max);

  if (!Number.isFinite(minRaw) || minRaw < 0) {
    return { error: "budget_min must be a non-negative number" };
  }
  if (!Number.isFinite(maxRaw) || maxRaw < 0) {
    return { error: "budget_max must be a non-negative number" };
  }

  let budget_min = Math.min(RECOMMEND_LIMITS.budgetCap, Math.round(minRaw));
  let budget_max = Math.min(RECOMMEND_LIMITS.budgetCap, Math.round(maxRaw));
  if (budget_min > budget_max) {
    const swap = budget_min;
    budget_min = budget_max;
    budget_max = swap;
  }
  if (budget_max === 0) {
    return { error: "budget_max must be greater than 0" };
  }

  let count = RECOMMEND_LIMITS.countMin as number;
  if (typeof raw.count === "number" && Number.isFinite(raw.count)) {
    count = Math.round(raw.count);
  }
  count = Math.min(
    RECOMMEND_LIMITS.countMax,
    Math.max(RECOMMEND_LIMITS.countMin, count),
  );

  return {
    category: raw.category,
    budget_min,
    budget_max,
    occasion,
    count,
  };
}

export function sanitizeRecommendedGift(
  raw: unknown,
  budgetMin: number,
  budgetMax: number,
): RecommendedGift | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const title = plainText(row.title, RECOMMEND_LIMITS.titleMax);
  if (title.length < 2) return null;

  const short_description = plainText(
    row.short_description ?? row.description ?? row.why,
    RECOMMEND_LIMITS.descriptionMax,
  );
  const search_keyword = plainText(
    row.search_keyword ?? row.searchKeyword ?? title,
    RECOMMEND_LIMITS.keywordMax,
  );
  if (!short_description || !search_keyword) return null;

  let estimated_price =
    typeof row.estimated_price === "number"
      ? row.estimated_price
      : Number(row.estimated_price ?? row.priceHint ?? row.price);
  if (!Number.isFinite(estimated_price)) return null;
  estimated_price = Math.round(estimated_price);
  if (estimated_price < budgetMin || estimated_price > budgetMax) {
    // Soft clamp into range rather than drop (model sometimes edges out)
    estimated_price = Math.min(budgetMax, Math.max(budgetMin, estimated_price));
  }

  const catalog_id =
    typeof row.catalog_id === "string"
      ? plainText(row.catalog_id, 64) || undefined
      : undefined;

  return {
    title,
    short_description,
    estimated_price,
    search_keyword,
    catalog_id,
    affiliate_ready: Boolean(row.affiliate_ready ?? catalog_id),
  };
}

export function sanitizeRecommendedGifts(
  list: unknown,
  count: number,
  budgetMin: number,
  budgetMax: number,
): RecommendedGift[] {
  if (!Array.isArray(list)) return [];
  const out: RecommendedGift[] = [];
  const seen = new Set<string>();
  for (const item of list) {
    const clean = sanitizeRecommendedGift(item, budgetMin, budgetMax);
    if (!clean) continue;
    const key = clean.title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(clean);
    if (out.length >= count) break;
  }
  return out;
}

/**
 * Tool implementation: search local catalog (affiliate / DB prep).
 * Returns JSON-serializable hits for the model.
 */
export function searchGiftCatalog(
  query: string,
  minPrice: number,
  maxPrice: number,
  category: GiftCategory,
): CatalogItem[] {
  const q = query.toLowerCase().trim();
  const tokens = q
    .split(/[^a-z0-9+#]+/i)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);

  const scored = GIFT_CATALOG.filter((item) => {
    if (item.category !== category && category !== "other") {
      // Allow other-category soft matches only when query is strong
      if (tokens.length < 2) return false;
    }
    if (item.price < minPrice || item.price > maxPrice) return false;
    return true;
  }).map((item) => {
    const hay =
      `${item.title} ${item.blurb} ${item.search_keyword} ${item.category}`.toLowerCase();
    let score = item.category === category ? 3 : 0;
    for (const t of tokens) {
      if (hay.includes(t)) score += 2;
    }
    return { item, score };
  });

  scored.sort((a, b) => b.score - a.score || a.item.price - b.item.price);
  return scored
    .filter((s) => s.score > 0 || s.item.category === category)
    .slice(0, 8)
    .map((s) => s.item);
}

export const SEARCH_GIFT_CATALOG_TOOL = {
  type: "function" as const,
  function: {
    name: "search_gift_catalog",
    description:
      "Search the Givy gift catalog (and future affiliate inventory) for real products matching a query and budget. Call this before finalizing recommendations so ideas map to buyable items.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search phrase, e.g. merino scarf or coffee subscription",
        },
        min_price: {
          type: "number",
          description: "Minimum price in USD",
        },
        max_price: {
          type: "number",
          description: "Maximum price in USD",
        },
        category: {
          type: "string",
          enum: [...GIFT_CATEGORIES],
          description: "Gift category filter",
        },
      },
      required: ["query", "min_price", "max_price", "category"],
    },
  },
};

function catalogFallback(input: RecommendInput): RecommendedGift[] {
  const hits = searchGiftCatalog(
    GIFT_CATEGORY_LABELS[input.category],
    input.budget_min,
    input.budget_max,
    input.category,
  );
  const gifts = hits.slice(0, input.count).map((item) => ({
    title: item.title,
    short_description: item.blurb,
    estimated_price: item.price,
    search_keyword: item.search_keyword,
    catalog_id: item.id,
    affiliate_ready: true,
  }));
  if (gifts.length >= input.count) return gifts;

  // Widen to any category in budget if thin
  const wider = GIFT_CATALOG.filter(
    (i) => i.price >= input.budget_min && i.price <= input.budget_max,
  ).slice(0, input.count);
  return sanitizeRecommendedGifts(
    wider.map((item) => ({
      title: item.title,
      short_description: item.blurb,
      estimated_price: item.price,
      search_keyword: item.search_keyword,
      catalog_id: item.id,
      affiliate_ready: true,
    })),
    input.count,
    input.budget_min,
    input.budget_max,
  );
}

type ChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }>;
  tool_call_id?: string;
};

function systemPrompt(input: RecommendInput): string {
  return [
    "You are an expert personal shopper for Givy, a gift wishlist app.",
    "Recommend thoughtful, buyable gifts that STRICTLY fit the category and budget.",
    `Category: ${GIFT_CATEGORY_LABELS[input.category]} (${input.category}).`,
    `Occasion: ${OCCASION_LABELS[input.occasion]}.`,
    `Budget: $${input.budget_min}–$${input.budget_max} USD inclusive. Every estimated_price MUST be inside this range.`,
    `Return exactly ${input.count} gift ideas.`,
    "Always call search_gift_catalog at least once with a relevant query before your final answer, so recommendations can map to catalog / affiliate inventory.",
    "After tool results, respond with ONLY valid JSON (no markdown):",
    '{"gifts":[{"title":"...","short_description":"...","estimated_price":0,"search_keyword":"...","catalog_id":"optional-id-from-catalog"}]}',
    "short_description explains why it fits category + budget + occasion.",
    "search_keyword is optimized for finding the product online (Google/Amazon).",
    "Prefer catalog_id when a catalog hit is a good match. Never invent URLs.",
  ].join("\n");
}

async function callRecommendAi(
  input: RecommendInput,
): Promise<{
  gifts: RecommendedGift[];
  catalogHits: number;
  error?: string;
} | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return { gifts: [], catalogHits: 0, error: "missing_key" };

  const base = (
    process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1"
  ).replace(/\/$/, "");
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";

  // Server-side catalog search (same tool the model can call) — seed the prompt.
  const seedHits = searchGiftCatalog(
    GIFT_CATEGORY_LABELS[input.category],
    input.budget_min,
    input.budget_max,
    input.category,
  );

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt(input) },
    {
      role: "user",
      content: [
        `Suggest ${input.count} gifts in category "${input.category}" for a ${OCCASION_LABELS[input.occasion]} between $${input.budget_min} and $${input.budget_max}.`,
        seedHits.length
          ? `Catalog matches to prefer when fitting:\n${JSON.stringify(
              seedHits.slice(0, 6).map((h) => ({
                catalog_id: h.id,
                title: h.title,
                price: h.price,
                search_keyword: h.search_keyword,
              })),
            )}`
          : "No catalog hits yet — invent strong buyable ideas in budget, then we will match keywords.",
        'Respond with ONLY JSON: {"gifts":[...]}',
      ].join("\n"),
    },
  ];

  let catalogHits = seedHits.length;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 28_000);

  try {
    // Pass 1: optional tool use (auto — not required; some keys/models reject "required")
    for (let round = 0; round < 3; round++) {
      const useTools = round < 2;
      const res = await fetch(`${base}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          temperature: 0.7,
          max_tokens: 1200,
          ...(useTools
            ? { tools: [SEARCH_GIFT_CATALOG_TOOL], tool_choice: "auto" }
            : { response_format: { type: "json_object" } }),
          messages,
        }),
      });

      if (!res.ok) {
        return {
          gifts: [],
          catalogHits,
          error: `http_${res.status}`,
        };
      }

      const data = (await res.json()) as {
        choices?: Array<{ message?: ChatMessage }>;
        error?: { message?: string; code?: string };
      };
      const message = data.choices?.[0]?.message;
      if (!message) {
        return { gifts: [], catalogHits, error: "empty_response" };
      }

      const toolCalls = message.tool_calls;
      if (useTools && toolCalls && toolCalls.length > 0) {
        messages.push({
          role: "assistant",
          content: message.content ?? null,
          tool_calls: toolCalls,
        });

        for (const call of toolCalls) {
          if (call.function.name !== "search_gift_catalog") {
            messages.push({
              role: "tool",
              tool_call_id: call.id,
              content: JSON.stringify({ error: "Unknown tool" }),
            });
            continue;
          }
          let args: {
            query?: string;
            min_price?: number;
            max_price?: number;
            category?: string;
          } = {};
          try {
            args = JSON.parse(call.function.arguments || "{}") as typeof args;
          } catch {
            args = {};
          }
          const cat = isGiftCategory(args.category)
            ? args.category
            : input.category;
          const minP = Number.isFinite(args.min_price)
            ? Number(args.min_price)
            : input.budget_min;
          const maxP = Number.isFinite(args.max_price)
            ? Number(args.max_price)
            : input.budget_max;
          const hits = searchGiftCatalog(
            String(args.query ?? input.category),
            minP,
            maxP,
            cat,
          );
          catalogHits += hits.length;
          messages.push({
            role: "tool",
            tool_call_id: call.id,
            content: JSON.stringify({
              results: hits.map((h) => ({
                catalog_id: h.id,
                title: h.title,
                price: h.price,
                search_keyword: h.search_keyword,
                blurb: h.blurb,
                category: h.category,
                affiliate_ready: true,
              })),
            }),
          });
        }
        // Next round: ask for final JSON
        messages.push({
          role: "user",
          content:
            'Using the tool results, reply with ONLY JSON: {"gifts":[{"title":"...","short_description":"...","estimated_price":0,"search_keyword":"...","catalog_id":"..."}]}',
        });
        continue;
      }

      const content = message.content;
      if (!content) {
        if (useTools) {
          // Force a JSON-only follow-up
          messages.push({
            role: "assistant",
            content: null,
          });
          messages.push({
            role: "user",
            content:
              'Reply with ONLY JSON: {"gifts":[{"title":"...","short_description":"...","estimated_price":0,"search_keyword":"..."}]}',
          });
          continue;
        }
        return { gifts: [], catalogHits, error: "empty_content" };
      }

      let parsed: unknown;
      try {
        const trimmed = content.trim();
        const jsonSlice = trimmed.startsWith("```")
          ? trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")
          : trimmed;
        parsed = JSON.parse(jsonSlice);
      } catch {
        return { gifts: [], catalogHits, error: "parse" };
      }

      const list =
        parsed &&
        typeof parsed === "object" &&
        Array.isArray((parsed as { gifts?: unknown }).gifts)
          ? (parsed as { gifts: unknown }).gifts
          : Array.isArray(parsed)
            ? parsed
            : null;

      const gifts = sanitizeRecommendedGifts(
        list,
        input.count,
        input.budget_min,
        input.budget_max,
      );
      if (gifts.length === 0) {
        return { gifts: [], catalogHits, error: "no_gifts" };
      }
      return { gifts, catalogHits };
    }
    return { gifts: [], catalogHits, error: "max_rounds" };
  } catch (err) {
    const name = err instanceof Error ? err.name : "";
    return {
      gifts: [],
      catalogHits,
      error: name === "AbortError" ? "timeout" : "network",
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function recommendGifts(
  input: RecommendInput,
): Promise<RecommendResult> {
  const configured = Boolean(process.env.OPENAI_API_KEY?.trim());
  const ai = await callRecommendAi(input);
  if (ai && ai.gifts.length > 0) {
    return {
      gifts: ai.gifts,
      source: "ai",
      catalog_hits: ai.catalogHits,
      openai_configured: configured,
    };
  }

  const fallback = catalogFallback(input);
  return {
    gifts: fallback,
    source: fallback.some((g) => g.catalog_id) ? "catalog" : "fallback",
    catalog_hits: fallback.filter((g) => g.catalog_id).length,
    openai_configured: configured,
    openai_error: ai?.error ?? (configured ? "unknown" : "missing_key"),
  };
}

const rateBuckets = new Map<string, number[]>();

export function allowRecommendRequest(key: string): boolean {
  const now = Date.now();
  const windowMs = RECOMMEND_LIMITS.rateWindowMs;
  const prev = rateBuckets.get(key) ?? [];
  const recent = prev.filter((t) => now - t < windowMs);
  if (recent.length >= RECOMMEND_LIMITS.rateMaxPerWindow) {
    rateBuckets.set(key, recent);
    return false;
  }
  recent.push(now);
  rateBuckets.set(key, recent);
  return true;
}
