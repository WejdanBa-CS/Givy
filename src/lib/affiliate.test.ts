import { afterEach, describe, expect, it } from "vitest";
import { affiliateOutboundUrl, skimlinksPublisherId } from "@/lib/affiliate";

const ENV_KEY = "NEXT_PUBLIC_SKIMLINKS_PUBLISHER_ID";

describe("affiliateOutboundUrl", () => {
  afterEach(() => {
    delete process.env[ENV_KEY];
  });

  it("returns https destination unchanged when publisher id is unset", () => {
    delete process.env[ENV_KEY];
    expect(affiliateOutboundUrl("https://shop.example/hat")).toBe(
      "https://shop.example/hat",
    );
  });

  it("wraps https destinations through Skimlinks when configured", () => {
    process.env[ENV_KEY] = "307683X1795970";
    const out = affiliateOutboundUrl(
      "https://shop.example/hat",
      "https://www.givy.gifts/g/ABC",
    );
    const url = new URL(out);
    expect(url.origin).toBe("https://go.redirectingat.com");
    expect(url.searchParams.get("id")).toBe("307683X1795970");
    expect(url.searchParams.get("url")).toBe("https://shop.example/hat");
    expect(url.searchParams.get("xs")).toBe("1");
    expect(url.searchParams.get("sref")).toBe("https://www.givy.gifts/g/ABC");
  });

  it("skimlinksPublisherId trims blank values", () => {
    process.env[ENV_KEY] = "  ";
    expect(skimlinksPublisherId()).toBeNull();
    process.env[ENV_KEY] = " 307683X1795970 ";
    expect(skimlinksPublisherId()).toBe("307683X1795970");
  });
});
