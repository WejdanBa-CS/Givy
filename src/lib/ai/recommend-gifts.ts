import type { Occasion } from "@/lib/types";
import { OCCASION_LABELS } from "@/lib/types";
import { resolveAiBaseUrl } from "@/lib/api-security";
import { plainText } from "@/lib/gift-suggest";
import { createRateLimiter } from "./rate-limit";
import {
  GIFT_CATALOG,
  GIFT_CATEGORIES,
  GIFT_CATEGORY_LABELS,
  type CatalogItem,
  type GiftCategory,
} from "./catalog";

export {
  GIFT_CATALOG,
  GIFT_CATEGORIES,
  GIFT_CATEGORY_LABELS,
  type CatalogItem,
  type GiftCategory,
} from "./catalog";

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
  openai_configured: boolean;
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

export function isGroqGptOssModel(baseUrl: string, model: string): boolean {
  try {
    return (
      new URL(baseUrl).hostname.toLowerCase() === "api.groq.com" &&
      model.startsWith("openai/gpt-oss-")
    );
  } catch {
    return false;
  }
}

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
    "Use supplied catalog matches whenever they fit. If search_gift_catalog is available, call it before your final answer.",
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

  const base = resolveAiBaseUrl();
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  const groqGptOss = isGroqGptOssModel(base, model);

  // Server-side catalog search (same tool the model can call) — seed the prompt.
  const seedHits = searchGiftCatalog(
    GIFT_CATEGORY_LABELS[input.category],
    input.budget_min,
    input.budget_max,
    input.category,
  );

  const userPrompt = [
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
  ].join("\n");

  // Groq’s GPT-OSS guidance recommends user-message instructions and JSON mode.
  // Catalog matches are already supplied above, so local tool orchestration is
  // optional and should not prevent gift recommendations from being returned.
  const messages: ChatMessage[] = groqGptOss
    ? [{ role: "user", content: `${systemPrompt(input)}\n\n${userPrompt}` }]
    : [
        { role: "system", content: systemPrompt(input) },
        { role: "user", content: userPrompt },
      ];

  let catalogHits = seedHits.length;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 28_000);

  try {
    // Pass 1: optional tool use (auto — not required; some keys/models reject "required")
    for (let round = 0; round < 3; round++) {
      const useTools = !groqGptOss && round < 2;
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
          max_completion_tokens: 1200,
          ...(groqGptOss ? { include_reasoning: false } : {}),
          ...(useTools
            ? { tools: [SEARCH_GIFT_CATALOG_TOOL], tool_choice: "auto" }
            : { response_format: { type: "json_object" } }),
          messages,
        }),
      });

      if (!res.ok) {
        const providerError = (await res.text()).slice(0, 500);
        console.warn("Givy AI provider request failed", {
          status: res.status,
          provider: new URL(base).hostname,
          model,
          response: providerError,
        });
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

export const allowRecommendRequest = createRateLimiter(
  RECOMMEND_LIMITS.rateWindowMs,
  RECOMMEND_LIMITS.rateMaxPerWindow,
);
