import type { GiftItem, GivyList } from "../types";
import { getListById, updateList } from "./local-lists";
import { pushActivity, uid } from "./storage";

export function addItem(
  listId: string,
  item: Omit<GiftItem, "id" | "purchased" | "purchasedAt" | "claimedByMe">,
): GiftItem | null {
  const list = getListById(listId);
  if (!list) return null;
  const gift: GiftItem = {
    ...item,
    id: uid("gift"),
    purchased: false,
  };
  if (gift.fundingMode === "cash_fund") {
    gift.goalMinor = gift.goalMinor ?? Math.round((gift.price ?? 0) * 100);
    gift.fundedMinor = 0;
    gift.campaignState = "open";
    gift.contributorCount = 0;
  }
  updateList(listId, { items: [...list.items, gift] });
  return gift;
}

export function removeItem(listId: string, itemId: string) {
  const list = getListById(listId);
  if (!list) return;
  updateList(listId, { items: list.items.filter((item) => item.id !== itemId) });
}

export function updateItem(
  listId: string,
  itemId: string,
  patch: Partial<
    Pick<
      GiftItem,
      | "title"
      | "notes"
      | "url"
      | "price"
      | "imageHint"
      | "quantity"
      | "quantityNeeded"
      | "priority"
      | "fundingMode"
      | "goalMinor"
    >
  >,
): GiftItem | null {
  const list = getListById(listId);
  if (!list) return null;
  const target = list.items.find((item) => item.id === itemId);
  if (!target || target.purchased) return null;
  const next = { ...target, ...patch };
  updateList(listId, {
    items: list.items.map((item) => (item.id === itemId ? next : item)),
  });
  return next;
}

export function pledgeItem(
  listId: string,
  itemId: string,
  amountMinor: number,
): GiftItem | null {
  const list = getListById(listId);
  if (!list) return null;
  const target = list.items.find((item) => item.id === itemId);
  if (!target || target.fundingMode !== "cash_fund") return null;
  const goal = target.goalMinor ?? Math.round((target.price ?? 0) * 100);
  const funded = (target.fundedMinor ?? 0) + amountMinor;
  const next: GiftItem = {
    ...target,
    goalMinor: goal,
    fundedMinor: funded,
    contributorCount: (target.contributorCount ?? 0) + 1,
    campaignState: goal > 0 && funded >= goal ? "funded" : "open",
  };
  updateList(listId, {
    items: list.items.map((item) => (item.id === itemId ? next : item)),
  });
  return next;
}

export function claimItem(
  listId: string,
  itemId: string,
  shipPreference: GiftItem["shipPreference"],
): GivyList | null {
  const list = getListById(listId);
  if (!list) return null;
  const target = list.items.find((item) => item.id === itemId);
  const items = list.items.map((item) => {
    if (item.id !== itemId || item.purchased) return item;
    return {
      ...item,
      purchased: true,
      purchasedAt: new Date().toISOString(),
      claimedByMe: true,
      shipPreference,
    };
  });
  const updated = updateList(listId, { items });
  if (updated && target) {
    pushActivity({
      type: "claim",
      message: `Someone claimed “${target.title}” (anonymous)`,
      listId,
    });
  }
  return updated;
}
