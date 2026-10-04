import { describe, expect, it } from "vitest";
import { addDaysIso, localDateParts } from "@/lib/reminders/timezone";

describe("reminder timezone helpers", () => {
  it("formats a stable ISO date in UTC", () => {
    const { iso } = localDateParts("UTC", new Date("2026-06-15T12:00:00.000Z"));
    expect(iso).toBe("2026-06-15");
  });

  it("adds days across month boundaries", () => {
    expect(addDaysIso("2026-01-28", 7)).toBe("2026-02-04");
    expect(addDaysIso("2026-12-30", 2)).toBe("2027-01-01");
  });

  it("week_before target is today + 7", () => {
    expect(addDaysIso("2026-10-04", 7)).toBe("2026-10-11");
  });

  it("Riyadh vs New York on the same UTC instant", () => {
    // 2026-03-20 21:30 UTC → Mar 21 in Riyadh (UTC+3), still Mar 20 in New York
    const instant = new Date("2026-03-20T21:30:00.000Z");
    expect(localDateParts("Asia/Riyadh", instant).iso).toBe("2026-03-21");
    expect(localDateParts("America/New_York", instant).iso).toBe("2026-03-20");
  });

  it("Berlin winter offset (UTC+1)", () => {
    const instant = new Date("2026-01-15T23:30:00.000Z");
    expect(localDateParts("Europe/Berlin", instant).iso).toBe("2026-01-16");
    expect(localDateParts("UTC", instant).iso).toBe("2026-01-15");
  });
});
