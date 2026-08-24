import type { Occasion } from "@/lib/types";
import { OCCASION_LABELS } from "@/lib/types";
import { resolveAiBaseUrl } from "@/lib/api-security";
import { CURATED_GIFT_SUGGESTIONS } from "@/lib/ai/catalog";
import { createRateLimiter } from "@/lib/ai/rate-limit";

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
  openai_configured?: boolean;
  openai_error?: string;
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
  // Bound input and tag bodies so tag-stripping cannot ReDoS on long "<" runs.
  const capped = raw.slice(0, Math.min(raw.length, Math.max(maxLen * 8, 2_000)));
  return capped
    .replace(/<[^<>]{0,200}>/g, " ")
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

  let count: number = SUGGEST_LIMITS.countMin;
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
  const pool = [...CURATED_GIFT_SUGGESTIONS[input.occasion]];
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
): Promise<{ suggestions: GiftSuggestion[] } | { error: string }> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return { error: "missing_key" };

  const base = resolveAiBaseUrl();
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

    if (!res.ok) return { error: `http_${res.status}` };
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return { error: "empty_content" };

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      return { error: "parse" };
    }

    const list =
      parsed &&
      typeof parsed === "object" &&
      Array.isArray((parsed as { suggestions?: unknown }).suggestions)
        ? (parsed as { suggestions: unknown }).suggestions
        : parsed;

    const clean = sanitizeSuggestions(list, input.count);
    if (clean.length === 0) return { error: "no_gifts" };
    return { suggestions: clean };
  } catch (err) {
    const name = err instanceof Error ? err.name : "";
    return { error: name === "AbortError" ? "timeout" : "network" };
  } finally {
    clearTimeout(timer);
  }
}

export async function suggestGifts(input: SuggestInput): Promise<SuggestResult> {
  const configured = Boolean(process.env.OPENAI_API_KEY?.trim());
  const ai = await callOpenAiCompatible(input);
  if ("suggestions" in ai && ai.suggestions.length > 0) {
    return {
      suggestions: ai.suggestions,
      source: "ai",
      openai_configured: configured,
    };
  }
  return {
    suggestions: curatedSuggestions(input),
    source: "fallback",
    openai_configured: configured,
    openai_error: "error" in ai ? ai.error : "unknown",
  };
}

/** Shared per-process sliding-window limiter for the suggestion endpoint. */
export const allowSuggestRequest = createRateLimiter(
  SUGGEST_LIMITS.rateWindowMs,
  SUGGEST_LIMITS.rateMaxPerWindow,
);
