import { describe, expect, it } from "vitest";
import {
  isGroqGptOssModel,
  parseRecommendBody,
  sanitizeRecommendedGift,
  searchGiftCatalog,
} from "@/lib/ai/recommend-gifts";

describe("isGroqGptOssModel", () => {
  it("identifies Groq GPT-OSS models only", () => {
    expect(
      isGroqGptOssModel(
        "https://api.groq.com/openai/v1",
        "openai/gpt-oss-20b",
      ),
    ).toBe(true);
    expect(
      isGroqGptOssModel(
        "https://api.groq.com/openai/v1",
        "llama-3.3-70b-versatile",
      ),
    ).toBe(false);
    expect(
      isGroqGptOssModel("https://api.openai.com/v1", "gpt-4o-mini"),
    ).toBe(false);
  });
});

describe("parseRecommendBody", () => {
  it("accepts category and budget range", () => {
    const parsed = parseRecommendBody({
      category: "tech",
      budget_min: 30,
      budget_max: 100,
      occasion: "birthday",
      count: 5,
    });
    expect(parsed).toMatchObject({
      category: "tech",
      budget_min: 30,
      budget_max: 100,
      occasion: "birthday",
      count: 5,
    });
  });

  it("swaps inverted budgets", () => {
    const parsed = parseRecommendBody({
      category: "home",
      budget_min: 80,
      budget_max: 20,
      occasion: "holiday",
    });
    expect(parsed).toMatchObject({ budget_min: 20, budget_max: 80 });
  });

  it("rejects bad category", () => {
    const parsed = parseRecommendBody({
      category: "spaceships",
      budget_min: 10,
      budget_max: 50,
    });
    expect(parsed).toHaveProperty("error");
  });
});

describe("searchGiftCatalog", () => {
  it("filters by category and budget", () => {
    const hits = searchGiftCatalog("candle scent", 20, 50, "home");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every((h) => h.price >= 20 && h.price <= 50)).toBe(true);
  });

  it("scores query tokens", () => {
    const hits = searchGiftCatalog("coffee subscription beans", 50, 100, "food");
    expect(hits[0]?.title.toLowerCase()).toContain("coffee");
  });
});

describe("sanitizeRecommendedGift", () => {
  it("keeps gifts inside budget", () => {
    const g = sanitizeRecommendedGift(
      {
        title: "Test mug",
        short_description: "Nice ceramic",
        estimated_price: 25,
        search_keyword: "ceramic mug",
      },
      10,
      40,
    );
    expect(g?.estimated_price).toBe(25);
  });

  it("clamps out-of-range prices", () => {
    const g = sanitizeRecommendedGift(
      {
        title: "Fancy watch",
        short_description: "Too spendy",
        estimated_price: 500,
        search_keyword: "watch",
      },
      20,
      80,
    );
    expect(g?.estimated_price).toBe(80);
  });
});
