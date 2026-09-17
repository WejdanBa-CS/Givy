import { describe, expect, it } from "vitest";
import { DEMO_SEED_ITEMS } from "@/lib/types";
import { sanitizeImageHint, sanitizeItemUrl } from "./mappers";

describe("sanitizeImageHint", () => {
  it("keeps https image URLs", () => {
    expect(sanitizeImageHint("https://cdn.example/gift.jpg")).toBe(
      "https://cdn.example/gift.jpg",
    );
  });

  it("ignores glyph seeds used by sample gifts (not URLs)", () => {
    expect(sanitizeImageHint("hat")).toBeNull();
    expect(sanitizeImageHint("socks")).toBeNull();
    expect(sanitizeImageHint("default")).toBeNull();
  });

  it("rejects cleartext http image URLs", () => {
    expect(() => sanitizeImageHint("http://cdn.example/gift.jpg")).toThrow(
      /https/,
    );
  });
});

describe("DEMO_SEED_ITEMS remote mapping", () => {
  it("can sanitize every sample gift without throwing", () => {
    const rows = DEMO_SEED_ITEMS.map((item) => ({
      title: item.title,
      url: sanitizeItemUrl(item.url),
      image_url: sanitizeImageHint(item.imageHint),
      funding_mode: item.fundingMode ?? "direct_purchase",
      goal_minor: item.goalMinor ?? null,
    }));

    expect(rows).toHaveLength(DEMO_SEED_ITEMS.length);
    expect(rows.every((row) => row.url?.startsWith("https://"))).toBe(true);
    expect(rows.every((row) => row.image_url === null)).toBe(true);
    expect(rows.some((row) => row.funding_mode === "cash_fund")).toBe(true);
  });
});
