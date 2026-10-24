import { describe, expect, it } from "vitest";
import {
  buildShareMetadata,
  resolveShareOccasion,
  sharePreviewCopy,
} from "@/lib/share-preview";

describe("sharePreviewCopy", () => {
  it("builds a Western wedding registry preview", () => {
    const copy = sharePreviewCopy({
      title: "Maya & Jordan",
      ownerName: "Maya",
      occasion: "wedding",
    });
    expect(copy.title).toContain("Maya & Jordan");
    expect(copy.title).toContain("Wedding registry");
    expect(copy.description.toLowerCase()).toContain("wedding registry");
    expect(copy.description).toContain("Maya");
  });

  it("uses baby shower language for baby lists", () => {
    const copy = sharePreviewCopy({
      title: "Norris baby list",
      ownerName: "Alex",
      occasion: "baby",
    });
    expect(copy.title).toContain("Baby shower");
    expect(copy.description.toLowerCase()).toContain("baby shower");
  });

  it("falls back safely for unknown occasions", () => {
    expect(resolveShareOccasion("not-real")).toBe("other");
    const copy = sharePreviewCopy({
      title: "Surprise",
      ownerName: null,
      occasion: null,
    });
    expect(copy.description).toContain("Someone");
    expect(copy.title).toContain("Surprise");
    expect(copy.occasion).toBe("other");
  });
});

describe("buildShareMetadata", () => {
  it("includes absolute Open Graph and Twitter images with the Givy card", () => {
    const meta = buildShareMetadata({
      title: "Holiday haul",
      ownerName: "Sam",
      occasion: "holiday",
      shareCode: "abc123",
    });
    expect(meta.openGraph?.url).toContain("/g/abc123");
    const images = meta.openGraph?.images;
    expect(Array.isArray(images) && images[0]).toBeTruthy();
    if (Array.isArray(images) && images[0] && typeof images[0] === "object") {
      expect(String(images[0].url)).toMatch(/^https?:\/\//);
      expect(String(images[0].url)).toContain("/g/abc123/opengraph-image");
      expect(images[0].width).toBe(1200);
      expect(images[0].height).toBe(630);
    }
    expect(meta.twitter?.card).toBe("summary_large_image");
  });
});
