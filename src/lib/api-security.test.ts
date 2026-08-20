import { describe, expect, it } from "vitest";
import {
  allowRate,
  clientKey,
  originAllowed,
  resolveAiBaseUrl,
} from "@/lib/api-security";

describe("api-security", () => {
  it("allows same-site origins", () => {
    const req = new Request("https://www.givy.gifts/api/test", {
      headers: { origin: "https://www.givy.gifts" },
    });
    expect(originAllowed(req)).toBe(true);
  });

  it("blocks evil origins", () => {
    const req = new Request("https://www.givy.gifts/api/test", {
      headers: { origin: "https://evil.example" },
    });
    expect(originAllowed(req)).toBe(false);
  });

  it("rate limits repeated keys", () => {
    const key = "test-bucket";
    expect(allowRate(key, 2, 60_000)).toBe(true);
    expect(allowRate(key, 2, 60_000)).toBe(true);
    expect(allowRate(key, 2, 60_000)).toBe(false);
  });

  it("prefers user id in clientKey", () => {
    const req = new Request("https://www.givy.gifts/api/test");
    expect(clientKey(req, "user-abc")).toBe("u:user-abc");
  });

  it("allows default OpenAI base URL", () => {
    expect(resolveAiBaseUrl()).toBe("https://api.openai.com/v1");
  });

  it("rejects disallowed AI hosts", () => {
    const prev = process.env.OPENAI_BASE_URL;
    process.env.OPENAI_BASE_URL = "https://evil.internal/v1";
    expect(() => resolveAiBaseUrl()).toThrow(/Disallowed|Invalid/);
    process.env.OPENAI_BASE_URL = prev;
  });
});
