import { describe, expect, it } from "vitest";
import { isGiftImageUrl } from "./gift-visual";

describe("gift visuals", () => {
  it("detects https image hints", () => {
    expect(isGiftImageUrl("https://cdn.example/a.jpg")).toBe(true);
    expect(isGiftImageUrl("hat")).toBe(false);
    expect(isGiftImageUrl("")).toBe(false);
  });
});
