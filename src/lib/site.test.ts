import { describe, expect, it } from "vitest";
import {
  CANONICAL_SITE_URL,
  dollarsToMinor,
  formatMinor,
  isLegacyPublicHost,
  mapFundingRpcError,
  minorToDollars,
  publicRequestOrigin,
  siteOriginSet,
} from "@/lib/site";

describe("site", () => {
  it("treats apex and Render hosts as legacy aliases", () => {
    expect(isLegacyPublicHost("givy.gifts")).toBe(true);
    expect(isLegacyPublicHost("givy.onrender.com")).toBe(true);
    expect(isLegacyPublicHost("www.givy.gifts")).toBe(false);
  });

  it("allows the custom domain in API origin checks", () => {
    expect(siteOriginSet().has(CANONICAL_SITE_URL)).toBe(true);
    expect(siteOriginSet().has("https://givy.gifts")).toBe(true);
  });

  it("maps Render's internal localhost:10000 to the public site", () => {
    const req = new Request("https://localhost:10000/auth/callback", {
      headers: { "x-forwarded-proto": "https" },
    });
    expect(publicRequestOrigin(req)).toBe(CANONICAL_SITE_URL);
  });

  it("uses the public Host header when request.url is the Render bind", () => {
    const req = new Request("https://localhost:10000/auth/callback", {
      headers: {
        host: "www.givy.gifts",
        "x-forwarded-proto": "https",
      },
    });
    expect(publicRequestOrigin(req)).toBe(CANONICAL_SITE_URL);
  });

  it("prefers the forwarded public host over the internal bind", () => {
    const req = new Request("http://localhost:10000/auth/callback", {
      headers: {
        "x-forwarded-host": "www.givy.gifts",
        "x-forwarded-proto": "https",
      },
    });
    expect(publicRequestOrigin(req)).toBe(CANONICAL_SITE_URL);
  });

  it("keeps local Next on port 3000", () => {
    const req = new Request("http://127.0.0.1:3000/auth/callback", {
      headers: { host: "127.0.0.1:3000" },
    });
    expect(publicRequestOrigin(req)).toBe("http://127.0.0.1:3000");
  });

  it("converts money in integer minor units", () => {
    expect(dollarsToMinor(180)).toBe(18000);
    expect(minorToDollars(4250)).toBe(42.5);
    expect(formatMinor(18000)).toMatch(/180/);
  });

  it("explains a missing funding RPC as a migration gap", () => {
    expect(
      mapFundingRpcError(
        "Could not find the function public.pledge_contribution in the schema cache",
      ).message,
    ).toMatch(/migration 011/i);
    expect(mapFundingRpcError("Gift not found").message).toBe("Gift not found");
  });
});
