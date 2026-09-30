import { describe, expect, it } from "vitest";
import {
  compareSemver,
  isOutdatedPlayShell,
  parseGivyPlayVersion,
} from "@/lib/play-version";

describe("play-version", () => {
  it("parses GivyPlayApp semver from UA", () => {
    expect(
      parseGivyPlayVersion(
        "Mozilla/5.0 ... Chrome/120.0.0.0 Mobile Safari/537.36 GivyPlayApp/1.1.5",
      ),
    ).toBe("1.1.5");
    expect(parseGivyPlayVersion("Mozilla/5.0")).toBeNull();
  });

  it("compares semver", () => {
    expect(compareSemver("1.1.4", "1.1.5")).toBeLessThan(0);
    expect(compareSemver("1.1.5", "1.1.5")).toBe(0);
    expect(compareSemver("1.2.0", "1.1.9")).toBeGreaterThan(0);
  });

  it("flags legacy hardcoded 1.0.0 Play shells as outdated", () => {
    expect(
      isOutdatedPlayShell("… GivyPlayApp/1.0.0", "1.1.5"),
    ).toBe(true);
    expect(
      isOutdatedPlayShell("… GivyPlayApp/1.1.5", "1.1.5"),
    ).toBe(false);
    expect(isOutdatedPlayShell("Mozilla/5.0 iPhone", "1.1.5")).toBe(false);
  });
});
