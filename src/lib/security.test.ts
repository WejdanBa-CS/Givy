import { describe, expect, it } from "vitest";
import {
  inviteLinkPath,
  isPaypalSupportUrl,
  normalizeInviteCode,
  paypalMeUrl,
  safeHttpUrl,
  safeNextPath,
  safeSupportUrl,
} from "@/lib/security";

describe("safeNextPath", () => {
  it("allows relative app paths", () => {
    expect(safeNextPath("/app")).toBe("/app");
    expect(safeNextPath("/g/abc?claim=1")).toBe("/g/abc?claim=1");
  });

  it("blocks open redirects", () => {
    expect(safeNextPath("https://evil.example")).toBe("/app");
    expect(safeNextPath("//evil.example")).toBe("/app");
    expect(safeNextPath("/\\evil.example")).toBe("/app");
    expect(safeNextPath("https://givy.onrender.com/app")).toBe("/app");
    expect(safeNextPath("@evil")).toBe("/app");
  });

  it("uses fallback when empty", () => {
    expect(safeNextPath(null, "/login")).toBe("/login");
    expect(safeNextPath("  ", "/login")).toBe("/login");
  });
});

describe("normalizeInviteCode", () => {
  it("accepts beta invite codes", () => {
    expect(normalizeInviteCode("GIVY-FRIEND-001")).toBe("GIVY-FRIEND-001");
    expect(normalizeInviteCode("  givy-closed-beta-5  ")).toBe(
      "givy-closed-beta-5",
    );
  });

  it("rejects unsafe values", () => {
    expect(normalizeInviteCode("bad code!")).toBeNull();
    expect(normalizeInviteCode("javascript:alert(1)")).toBeNull();
    expect(normalizeInviteCode("")).toBeNull();
  });
});

describe("inviteLinkPath", () => {
  it("builds shareable invite paths", () => {
    expect(inviteLinkPath("GIVY-FRIEND-001")).toBe(
      "/invite/GIVY-FRIEND-001",
    );
    expect(inviteLinkPath("GIVY-FRIEND-001", "https://givy.onrender.com")).toBe(
      "https://givy.onrender.com/invite/GIVY-FRIEND-001",
    );
  });
});

describe("safeHttpUrl", () => {
  it("allows http and https", () => {
    expect(safeHttpUrl("https://shop.example/item")).toBe(
      "https://shop.example/item",
    );
    expect(safeHttpUrl("http://shop.example/item")).toContain("http://");
  });

  it("blocks dangerous schemes", () => {
    expect(safeHttpUrl("javascript:alert(1)")).toBeNull();
    expect(safeHttpUrl("data:text/html,hi")).toBeNull();
    expect(safeHttpUrl("file:///etc/passwd")).toBeNull();
  });

  it("blocks embedded credentials", () => {
    expect(safeHttpUrl("https://user:pass@evil.example")).toBeNull();
  });
});

describe("safeSupportUrl / PayPal", () => {
  it("allows PayPal and Ko-fi https hosts", () => {
    expect(safeSupportUrl("https://www.paypal.com/paypalme/givy")).toContain(
      "paypal.com",
    );
    expect(safeSupportUrl("https://ko-fi.com/givy")).toContain("ko-fi.com");
  });

  it("rejects unknown tip hosts", () => {
    expect(safeSupportUrl("https://evil.example/pay")).toBeNull();
    expect(safeSupportUrl("http://paypal.com/x")).toBeNull();
  });

  it("normalizes paypal.me handles", () => {
    expect(paypalMeUrl("givycreator")).toBe(
      "https://www.paypal.com/paypalme/givycreator",
    );
    expect(paypalMeUrl("bad handle")).toBeNull();
  });

  it("detects PayPal support links", () => {
    expect(isPaypalSupportUrl("https://paypal.me/givy")).toBe(true);
    expect(isPaypalSupportUrl("https://ko-fi.com/givy")).toBe(false);
  });
});
