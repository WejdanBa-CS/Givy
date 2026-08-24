import type { Giveaway, User } from "../types";
import { pushActivity, readJson, STORAGE_KEYS, uid, writeJson } from "./storage";

export function getGiveaways(): Giveaway[] {
  return readJson<Giveaway[]>(STORAGE_KEYS.giveaways, []).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

export function saveGiveaways(items: Giveaway[]) {
  writeJson(STORAGE_KEYS.giveaways, items);
}

export function getGiveawayById(id: string): Giveaway | null {
  return getGiveaways().find((giveaway) => giveaway.id === id) ?? null;
}

export function createGiveaway(input: {
  owner: User;
  title: string;
  description: string;
  itemName: string;
  area: string;
  endsAt: string;
}): Giveaway {
  const giveaway: Giveaway = {
    id: uid("give"),
    ownerId: input.owner.id,
    ownerName: input.owner.name,
    title: input.title,
    description: input.description,
    itemName: input.itemName,
    area: input.area,
    endsAt: input.endsAt,
    status: "open",
    entrantIds: [],
    createdAt: new Date().toISOString(),
  };
  saveGiveaways([giveaway, ...getGiveaways()]);
  return giveaway;
}

export function joinGiveaway(giveawayId: string, userId: string): Giveaway | null {
  const items = getGiveaways();
  const index = items.findIndex((giveaway) => giveaway.id === giveawayId);
  if (index < 0) return null;
  const giveaway = items[index];
  if (!giveaway) return null;
  if (
    giveaway.status !== "open" ||
    giveaway.entrantIds.includes(userId) ||
    giveaway.ownerId === userId
  ) {
    return giveaway;
  }
  const updated = { ...giveaway, entrantIds: [...giveaway.entrantIds, userId] };
  items[index] = updated;
  saveGiveaways(items);
  pushActivity({
    type: "giveaway_join",
    message: `Joined giveaway “${giveaway.title}”`,
    giveawayId,
  });
  return updated;
}

export function drawGiveawayLocal(
  giveawayId: string,
  ownerId: string,
  currentUser?: User | null,
): Giveaway | null {
  const items = getGiveaways();
  const index = items.findIndex((giveaway) => giveaway.id === giveawayId);
  if (index < 0) return null;
  const giveaway = items[index];
  if (!giveaway) return null;
  if (
    giveaway.ownerId !== ownerId ||
    giveaway.status !== "open" ||
    giveaway.entrantIds.length === 0
  ) {
    return giveaway;
  }
  const winnerId = giveaway.entrantIds[Math.floor(Math.random() * giveaway.entrantIds.length)];
  if (!winnerId) return giveaway;
  const winnerName =
    winnerId === currentUser?.id
      ? currentUser.name
      : winnerId.startsWith("neighbor")
        ? `Neighbor ${winnerId.slice(-1)}`
        : "Lucky winner";
  const updated: Giveaway = {
    ...giveaway,
    status: "drawn",
    winnerId,
    winnerName,
  };
  items[index] = updated;
  saveGiveaways(items);
  pushActivity({
    type: "giveaway_win",
    message: `Drew a winner for “${giveaway.title}”: ${winnerName}`,
    giveawayId,
  });
  return updated;
}
