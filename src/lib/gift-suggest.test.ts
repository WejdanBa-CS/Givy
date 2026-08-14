import { describe, expect, it } from "vitest";
import {
  curatedSuggestions,
  parseSuggestBody,
  plainText,
  sanitizeSuggestion,
  sanitizeSuggestions,
} from "@/lib/gift-suggest";

describe("plainText", () => {
  it("strips HTML and control characters", () => {
    expect(plainText("<b>Hello</b>\n\tWorld", 80)).toBe("Hello World");
  });

  it("truncates to max length", () => {
    expect(plainText("abcdefghij", 5)).toBe("abcde");
  });

  it("handles long runs of '<' without hanging", () => {
    const attack = `${"<".repeat(50_000)}hello`;
    const start = Date.now();
    // Cap + bounded tag matcher; unmatched '<' is treated as plain text, not backtracking.
    const out = plainText(attack, 80);
    expect(out.length).toBeLessThanOrEqual(80);
    expect(out.includes("hello")).toBe(false);
    expect(Date.now() - start).toBeLessThan(200);
  });
});

describe("parseSuggestBody", () => {
  it("defaults occasion and clamps count", () => {
    const parsed = parseSuggestBody({
      interests: "  hiking  ",
      count: 99,
    });
    expect(parsed).toMatchObject({
      occasion: "other",
      interests: "hiking",
      count: 8,
    });
  });

  it("rejects bad budget", () => {
    const parsed = parseSuggestBody({ budgetMax: -5 });
    expect(parsed).toEqual({ error: "budgetMax must be a non-negative number" });
  });
});

describe("sanitizeSuggestion", () => {
  it("drops empty titles and HTML", () => {
    expect(sanitizeSuggestion({ title: "<script>x</script>" })).toBeNull();
    expect(
      sanitizeSuggestion({
        title: "  Nice <em>mug</em> ",
        notes: "<b>ceramic</b>",
        priceHint: "24.7",
      }),
    ).toEqual({
      title: "Nice mug",
      notes: "ceramic",
      priceHint: 25,
      why: undefined,
    });
  });
});

describe("curatedSuggestions", () => {
  it("returns unique ideas for an occasion", () => {
    const list = curatedSuggestions({
      occasion: "birthday",
      interests: "coffee reading",
      count: 5,
    });
    expect(list.length).toBe(5);
    expect(new Set(list.map((s) => s.title)).size).toBe(5);
  });

  it("dedupes titles and respects count", () => {
    expect(
      sanitizeSuggestions(
        [{ title: "Art print" }, { title: "Art print" }, { title: "Mug" }],
        2,
      ),
    ).toHaveLength(2);
  });
});
