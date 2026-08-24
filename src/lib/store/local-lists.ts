import { DEMO_SEED_ITEMS, type GivyList, type User } from "../types";
import { pushActivity, readJson, STORAGE_KEYS, uid, writeJson } from "./storage";

export function getLists(): GivyList[] {
  return readJson<GivyList[]>(STORAGE_KEYS.lists, []);
}

export function saveLists(lists: GivyList[]) {
  writeJson(STORAGE_KEYS.lists, lists);
}

export function getListsForUser(userId: string): GivyList[] {
  return getLists()
    .filter((list) => list.ownerId === userId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getListById(id: string): GivyList | null {
  return getLists().find((list) => list.id === id) ?? null;
}

export function getListByShareCode(code: string): GivyList | null {
  return getLists().find((list) => list.shareCode === code && list.published) ?? null;
}

/** Published list for guests — never include shipping address. */
export function getPublicListByShareCode(code: string): GivyList | null {
  const list = getListByShareCode(code);
  if (!list) return null;
  return {
    ...list,
    hasRecipientAddress: Boolean(list.recipientAddress?.trim()),
    recipientAddress: undefined,
  };
}

export function createList(input: {
  owner: User;
  title: string;
  occasion: GivyList["occasion"];
  description?: string;
  eventDate: string;
  recipientAddress?: string;
  supportUrl?: string;
  supportLabel?: string;
  withDemoItems?: boolean;
}): GivyList {
  const now = new Date().toISOString();
  const list: GivyList = {
    id: uid("givy"),
    ownerId: input.owner.id,
    ownerName: input.owner.name,
    title: input.title,
    occasion: input.occasion,
    description: input.description,
    eventDate: input.eventDate,
    recipientAddress: input.recipientAddress,
    supportUrl: input.supportUrl,
    supportLabel: input.supportLabel,
    shareCode: uid("share").replace("share_", "").slice(0, 10),
    published: false,
    items: input.withDemoItems
      ? DEMO_SEED_ITEMS.map((item) => ({
          ...item,
          id: uid("gift"),
          purchased: false,
        }))
      : [],
    createdAt: now,
    updatedAt: now,
  };
  saveLists([...getLists(), list]);
  pushActivity({
    type: "create",
    message: `Created “${list.title}”`,
    listId: list.id,
  });
  return list;
}

export function updateList(id: string, patch: Partial<GivyList>): GivyList | null {
  const lists = getLists();
  const index = lists.findIndex((list) => list.id === id);
  if (index < 0) return null;
  const existing = lists[index];
  if (!existing) return null;
  const updated: GivyList = {
    ...existing,
    ...patch,
    id: existing.id,
    updatedAt: new Date().toISOString(),
  };
  lists[index] = updated;
  saveLists(lists);
  return updated;
}

export function deleteList(id: string) {
  saveLists(getLists().filter((list) => list.id !== id));
}

export function publishList(listId: string): GivyList | null {
  const list = updateList(listId, { published: true });
  if (list) {
    pushActivity({
      type: "publish",
      message: `Shared “${list.title}”`,
      listId,
    });
  }
  return list;
}

export function duplicateList(
  sourceListId: string,
  owner: User,
  newTitle?: string,
  newEventDate?: string,
): GivyList | null {
  const sourceList = getListById(sourceListId);
  if (!sourceList) return null;

  const now = new Date().toISOString();
  const duplicatedList: GivyList = {
    ...sourceList,
    id: uid("givy"),
    ownerId: owner.id,
    ownerName: owner.name,
    title: newTitle || sourceList.title,
    eventDate: newEventDate || sourceList.eventDate,
    shareCode: uid("share").replace("share_", "").slice(0, 10),
    published: false,
    items: sourceList.items.map((item) => ({
      ...item,
      id: uid("gift"),
      purchased: false,
      purchasedAt: undefined,
      claimedByMe: undefined,
    })),
    templateSourceId: sourceListId,
    createdAt: now,
    updatedAt: now,
  };

  saveLists([...getLists(), duplicatedList]);
  pushActivity({
    type: "create",
    message: `Duplicated “${duplicatedList.title}”`,
    listId: duplicatedList.id,
  });
  return duplicatedList;
}

export function searchLists(query: string, userId: string): GivyList[] {
  const userLists = getListsForUser(userId);
  if (!query.trim()) return userLists;

  const lowerQuery = query.toLowerCase();
  return userLists.filter(
    (list) =>
      list.title.toLowerCase().includes(lowerQuery) ||
      list.description?.toLowerCase().includes(lowerQuery) ||
      list.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery)),
  );
}

export function filterListsByTag(tag: string, userId: string): GivyList[] {
  const userLists = getListsForUser(userId);
  if (!tag.trim()) return userLists;

  const lowerTag = tag.toLowerCase();
  return userLists.filter((list) =>
    list.tags?.some((listTag) => listTag.toLowerCase() === lowerTag),
  );
}

export function getAllTags(userId: string): string[] {
  const tagSet = new Set<string>();
  getListsForUser(userId).forEach((list) => {
    list.tags?.forEach((tag) => tagSet.add(tag));
  });
  return Array.from(tagSet).sort();
}
