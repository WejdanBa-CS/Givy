import { DEMO_SEED_ITEMS, type Giveaway, type GivyList, type User } from "../types";
import { getGiveaways, saveGiveaways } from "./local-giveaways";
import { getLists, getListsForUser, saveLists } from "./local-lists";
import { STORAGE_KEYS, uid, writeJson } from "./storage";

/** First-login demo content so the app feels alive. */
export function ensureSeedData(user: User) {
  if (typeof window === "undefined") return;
  if (
    localStorage.getItem(STORAGE_KEYS.seeded) === "1" &&
    getListsForUser(user.id).length > 0
  ) {
    return;
  }

  const now = new Date();
  const birthday = new Date(now);
  birthday.setDate(birthday.getDate() + 18);
  const holiday = new Date(now.getFullYear(), 11, 25);
  if (holiday < now) holiday.setFullYear(holiday.getFullYear() + 1);
  const giveawayEnd = new Date(now);
  giveawayEnd.setDate(giveawayEnd.getDate() + 5);

  const birthdayList: GivyList = {
    id: uid("givy"),
    ownerId: user.id,
    ownerName: user.name,
    title: `${user.name.split(" ")[0]}'s birthday`,
    occasion: "birthday",
    description: "A few things I'd love. No pressure, just ideas.",
    eventDate: birthday.toISOString().slice(0, 10),
    recipientAddress: "184 Maple Street, Apt 4B",
    shareCode: "demo" + uid().slice(-6),
    published: true,
    items: DEMO_SEED_ITEMS.map((item, index) => ({
      ...item,
      id: uid("gift"),
      purchased: index === 0,
      purchasedAt: index === 0 ? now.toISOString() : undefined,
    })),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  const holidayList: GivyList = {
    id: uid("givy"),
    ownerId: user.id,
    ownerName: user.name,
    title: "Holiday wishlist",
    occasion: "holiday",
    description: "For anyone shopping early.",
    eventDate: holiday.toISOString().slice(0, 10),
    shareCode: uid("share").replace("share_", "").slice(0, 10),
    published: false,
    items: [
      {
        id: uid("gift"),
        title: "Cozy throw blanket",
        notes: "Neutral colors",
        price: 45,
        url: "https://www.example.com/blanket",
        imageHint: "default",
        purchased: false,
      },
      {
        id: uid("gift"),
        title: "Board game night kit",
        price: 38,
        url: "https://www.example.com/game",
        imageHint: "default",
        purchased: false,
      },
    ],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  const existingLists = getLists().filter((list) => list.ownerId !== user.id);
  saveLists([...existingLists, birthdayList, holidayList]);

  const community: Giveaway = {
    id: uid("give"),
    ownerId: "community",
    ownerName: "Maya Chen",
    title: "Free coffee table",
    description:
      "Moving next week. Solid wood coffee table, minor scuffs. Pickup only.",
    itemName: "Mid-century coffee table",
    area: "Within 10 miles",
    endsAt: giveawayEnd.toISOString().slice(0, 10),
    status: "open",
    entrantIds: [],
    createdAt: now.toISOString(),
  };

  const mine: Giveaway = {
    id: uid("give"),
    ownerId: user.id,
    ownerName: user.name,
    title: "Desk lamp giveaway",
    description: "Barely used lamp. First lucky neighbor wins.",
    itemName: "Adjustable desk lamp",
    area: "Same neighborhood",
    endsAt: giveawayEnd.toISOString().slice(0, 10),
    status: "open",
    entrantIds: ["neighbor_1", "neighbor_2"],
    createdAt: now.toISOString(),
  };

  saveGiveaways([
    community,
    mine,
    ...getGiveaways().filter(
      (giveaway) => giveaway.ownerId !== user.id && giveaway.ownerId !== "community",
    ),
  ]);

  writeJson(STORAGE_KEYS.activity, [
    {
      id: uid("act"),
      type: "create" as const,
      message: `Created “${birthdayList.title}”`,
      at: now.toISOString(),
      listId: birthdayList.id,
    },
    {
      id: uid("act"),
      type: "publish" as const,
      message: "Shared birthday list with friends",
      at: now.toISOString(),
      listId: birthdayList.id,
    },
    {
      id: uid("act"),
      type: "claim" as const,
      message: "Someone claimed “Wool beanie” (anonymous)",
      at: now.toISOString(),
      listId: birthdayList.id,
    },
  ]);

  localStorage.setItem(STORAGE_KEYS.seeded, "1");
}
