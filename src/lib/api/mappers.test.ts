import { describe, expect, it } from "vitest";
import { DEMO_SEED_ITEMS } from "@/lib/types";
import { mapListWriteError } from "./lists";
import { sanitizeImageHint, sanitizeItemUrl, splitImageHint } from "./mappers";

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

describe("splitImageHint", () => {
  it("stores glyph seeds in emoji and https images in image_url", () => {
    expect(splitImageHint("hat")).toEqual({ imageUrl: null, glyph: "hat" });
    expect(splitImageHint("https://cdn.example/gift.jpg")).toEqual({
      imageUrl: "https://cdn.example/gift.jpg",
      glyph: null,
    });
  });
});

describe("DEMO_SEED_ITEMS remote mapping", () => {
  it("can sanitize every sample gift without throwing", () => {
    const rows = DEMO_SEED_ITEMS.map((item) => {
      const { imageUrl, glyph } = splitImageHint(item.imageHint);
      return {
        title: item.title,
        url: sanitizeItemUrl(item.url),
        image_url: imageUrl,
        emoji: glyph,
        funding_mode: item.fundingMode ?? "direct_purchase",
        goal_minor: item.goalMinor ?? null,
      };
    });

    expect(rows).toHaveLength(DEMO_SEED_ITEMS.length);
    expect(rows.every((row) => row.url?.startsWith("https://"))).toBe(true);
    expect(rows.every((row) => row.image_url === null)).toBe(true);
    expect(rows.every((row) => typeof row.emoji === "string")).toBe(true);
    expect(rows.some((row) => row.funding_mode === "cash_fund")).toBe(true);
  });
});

describe("mapListWriteError", () => {
  it("maps invite / beta gate failures", () => {
    expect(
      mapListWriteError({
        message: "Invite required before creating or editing lists",
      }).message,
    ).toMatch(/invite/i);
  });

  it("maps permission denied helper failures", () => {
    expect(
      mapListWriteError({
        message: "permission denied for function is_safe_support_url",
      }).message,
    ).toMatch(/database permission/i);
  });
});
