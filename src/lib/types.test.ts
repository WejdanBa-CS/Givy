import { describe, expect, it } from "vitest";
import { isFunded, isGroupFund, type GiftItem } from "@/lib/types";

function item(patch: Partial<GiftItem>): GiftItem {
  return {
    id: "gift_1",
    title: "Cabin",
    purchased: false,
    ...patch,
  };
}

describe("group fund helpers", () => {
  it("treats cash_fund items as group funds", () => {
    expect(isGroupFund(item({ fundingMode: "cash_fund" }))).toBe(true);
    expect(isGroupFund(item({ fundingMode: "direct_purchase" }))).toBe(false);
  });

  it("marks a campaign funded at or above the goal", () => {
    expect(
      isFunded(
        item({
          fundingMode: "cash_fund",
          goalMinor: 18000,
          fundedMinor: 18000,
        }),
      ),
    ).toBe(true);
    expect(
      isFunded(
        item({
          fundingMode: "cash_fund",
          goalMinor: 18000,
          fundedMinor: 4500,
        }),
      ),
    ).toBe(false);
  });
});
