import { afterEach, describe, expect, it } from "vitest";
import {
  affiliateOutboundUrl,
  skimlinksEnabled,
  skimlinksPublisherId,
} from "@/lib/affiliate";

const ID_KEY = "NEXT_PUBLIC_SKIMLINKS_PUBLISHER_ID";
const ON_KEY = "NEXT_PUBLIC_SKIMLINKS_ENABLED";

describe("affiliate helpers", () => {
  afterEach(() => {
    delete process.env[ID_KEY];
    delete process.env[ON_KEY];
  });

  it("returns https destination unchanged (no redirectingat wrap)", () => {
    process.env[ID_KEY] = "307683X1795970";
    process.env[ON_KEY] = "true";
    expect(affiliateOutboundUrl("https://shop.example/hat")).toBe(
      "https://shop.example/hat",
    );
  });

  it("skimlinksEnabled requires both flags", () => {
    expect(skimlinksEnabled()).toBe(false);
    process.env[ID_KEY] = "307683X1795970";
    expect(skimlinksEnabled()).toBe(false);
    process.env[ON_KEY] = "true";
    expect(skimlinksEnabled()).toBe(true);
  });

  it("skimlinksPublisherId trims blank values", () => {
    process.env[ID_KEY] = "  ";
    expect(skimlinksPublisherId()).toBeNull();
    process.env[ID_KEY] = " 307683X1795970 ";
    expect(skimlinksPublisherId()).toBe("307683X1795970");
  });
});
