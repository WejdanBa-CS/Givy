import { describe, expect, it } from "vitest";
import {
  giftIllustrationSrc,
  isGiftImageUrl,
  resolveGiftVisualSeed,
} from "./gift-visual";

describe("gift visuals", () => {
  it("detects https image hints", () => {
    expect(isGiftImageUrl("https://cdn.example/a.jpg")).toBe(true);
    expect(isGiftImageUrl("hat")).toBe(false);
  });

  it("resolves known seeds and title keywords", () => {
    expect(resolveGiftVisualSeed("Wool beanie", "hat")).toBe("hat");
    expect(resolveGiftVisualSeed("Soft leather tote")).toBe("bag");
    expect(resolveGiftVisualSeed("Ceramic pour-over")).toBe("mug");
    expect(resolveGiftVisualSeed("Mystery thing")).toBe("default");
  });

  it("maps seeds to public illustration paths", () => {
    expect(giftIllustrationSrc("watch")).toBe("/gifts/watch.svg");
    expect(giftIllustrationSrc("unknown")).toBe("/gifts/default.svg");
  });
});
