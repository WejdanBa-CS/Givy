import type {
  ActivityEvent,
  AuthProvider,
  GiftItem,
  Giveaway,
  GivyList,
  User,
} from "./types";
import { DEMO_SEED_ITEMS } from "./types";

const USER_KEY = "givy.user";
const LISTS_KEY = "givy.lists";
const GIVEAWAYS_KEY = "givy.giveaways";
const ACTIVITY_KEY = "givy.activity";
const SEEDED_KEY = "givy.seeded";

const STORAGE_ENC_VERSION = 1;
const STORAGE_SALT = "givy.local.storage.salt.v1";

type EncryptedEnvelope = {
  v: number;
  iv: string;
  data: string;
};

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function getStorageKey(): Promise<CryptoKey | null> {
  if (typeof window === "undefined" || !window.crypto?.subtle) return null;
  const secret = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.NEXT_PUBLIC_STORAGE_SECRET;
  if (!secret) return null;

  const enc = new TextEncoder();
  const baseKey = await window.crypto.subtle.importKey("raw", enc.encode(secret), "PBKDF2", false, ["deriveKey"]);
  return window.crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: enc.encode(STORAGE_SALT), iterations: 100000, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

async function encryptText(plainText: string): Promise<EncryptedEnvelope | null> {
  const key = await getStorageKey();
  if (!key) return null;
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plainText);
  const encrypted = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  return { v: STORAGE_ENC_VERSION, iv: toBase64(iv), data: toBase64(new Uint8Array(encrypted)) };
}

async function decryptText(payload: EncryptedEnvelope): Promise<string | null> {
  const key = await getStorageKey();
  if (!key) return null;
  try {
    const iv = fromBase64(payload.iv);
    const data = fromBase64(payload.data);
    const plain = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
    return new TextDecoder().decode(plain);
  } catch {
    return null;
  }
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;

    const parsed = JSON.parse(raw) as T | EncryptedEnvelope;
    if (
      parsed &&
      typeof parsed === "object" &&
      "v" in parsed &&
      "iv" in parsed &&
      "data" in parsed
    ) {
      // Decryption is async; keep sync API by returning fallback if encrypted value is encountered before async hydration paths.
      return fallback;
    }

    return parsed as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  const serialized = JSON.stringify(value);
  void encryptText(serialized).then((encrypted) => {
    if (!encrypted) return;
    localStorage.setItem(key, JSON.stringify(encrypted));
  });
}

export function getCurrentUser(): User | null {
  const user = readJson<User | null>(USER_KEY, null);
  if (!user || user.provider !== "guest") return user;
  if (user.name !== "Guest" && !user.name.startsWith("Guest")) return user;

  const updated: User = { ...user, name: "Alex" };
  writeJson(USER_KEY, updated);

  const lists = getLists().map((list) => {
    if (list.ownerId !== user.id) return list;
    const title =
      list.title === "Guest's birthday" || list.title.startsWith("Guest's ")
        ? list.title.replace(/^Guest/, "Alex")
        : list.title;
    return {
      ...list,
      ownerName: "Alex",
      title,
    };
  });
  writeJson(LISTS_KEY, lists);

  const giveaways = getGiveaways().map((g) =>
    g.ownerId === user.id ? { ...g, ownerName: "Alex" } : g,
  );
  writeJson(GIVEAWAYS_KEY, giveaways);

  return updated;
}

export function signIn(provider: AuthProvider): User {
  const saved = readJson<Record<string, User>>("givy.users", {});
  if (saved[provider]) {
    const existing = saved[provider];
    const user =
      provider === "guest" && !existing.betaUnlocked
        ? { ...existing, betaUnlocked: true, email: "" }
        : existing;
    if (user !== existing) {
      saved[provider] = user;
      writeJson("givy.users", saved);
    }
    writeJson(USER_KEY, user);
    ensureSeedData(user);
    return user;
  }

  const names: Record<AuthProvider, string> = {
    google: "Alex Rivera",
    apple: "Jordan Lee",
    facebook: "Sam Okoye",
    guest: "Alex",
    email: "Email user",
  };
  const emails: Record<AuthProvider, string> = {
    google: "alex@gmail.com",
    apple: "jordan@icloud.com",
    facebook: "sam@facebook.com",
    guest: "",
    email: "you@example.com",
  };
  const user: User = {
    id: uid("user"),
    name: names[provider],
    email: emails[provider],
    provider,
    avatarHue: crypto.getRandomValues(new Uint32Array(1))[0] % 360,
    betaUnlocked: provider === "guest" ? true : undefined,
  };
  saved[provider] = user;
  writeJson("givy.users", saved);
  writeJson(USER_KEY, user);
  ensureSeedData(user);
  return user;
}

export function signOut() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(USER_KEY);
}

const LOCAL_EMAIL_AUTH_KEY = "givy.email_accounts";

type LocalEmailAccount = {
  password: string;
  user: User;
};

/** Local demo mode only — not used when Supabase is configured. */
export function signInWithEmailLocal(
  email: string,
  password: string,
  mode: "signin" | "signup",
  displayName?: string,
): User {
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error("Enter a valid email address.");
  }
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  const accounts = readJson<Record<string, LocalEmailAccount>>(
    LOCAL_EMAIL_AUTH_KEY,
    {},
  );
  const existing = accounts[normalized];

  if (mode === "signup") {
    if (existing) throw new Error("An account with this email already exists.");
    const user: User = {
      id: uid("user"),
      name: displayName?.trim() || normalized.split("@")[0] || "Givy user",
      email: normalized,
      provider: "email",
      avatarHue: crypto.getRandomValues(new Uint32Array(1))[0] % 360,
    };
    accounts[normalized] = { password, user };
    writeJson(LOCAL_EMAIL_AUTH_KEY, accounts);
    writeJson(USER_KEY, user);
    ensureSeedData(user);
    return user;
  }

  if (!existing || existing.password !== password) {
    throw new Error("Invalid email or password.");
  }
  writeJson(USER_KEY, existing.user);
  ensureSeedData(existing.user);
  return existing.user;
}

function saveLists(lists: GivyList[]) {
  writeJson(LISTS_KEY, lists);
}

function saveGiveaways(items: Giveaway[]) {
  writeJson(GIVEAWAYS_KEY, items);
}

function pushActivity(event: Omit<ActivityEvent, "id" | "at">) {
  const events = getActivity();
  events.unshift({
    ...event,
    id: uid("act"),
    at: new Date().toISOString(),
  });
  writeJson(ACTIVITY_KEY, events.slice(0, 40));
}

export function getActivity(): ActivityEvent[] {
  return readJson<ActivityEvent[]>(ACTIVITY_KEY, []);
}

export function getLists(): GivyList[] {
  return readJson<GivyList[]>(LISTS_KEY, []);
}

export function getListsForUser(userId: string): GivyList[] {
  return getLists()
    .filter((l) => l.ownerId === userId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getListById(id: string): GivyList | null {
  return getLists().find((l) => l.id === id) ?? null;
}

export function getListByShareCode(code: string): GivyList | null {
  return (
    getLists().find((l) => l.shareCode === code && l.published) ?? null
  );
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

export function getGiveaways(): Giveaway[] {
  return readJson<Giveaway[]>(GIVEAWAYS_KEY, []).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

export function getGiveawayById(id: string): Giveaway | null {
  return getGiveaways().find((g) => g.id === id) ?? null;
}

/** First-login demo content so the app feels alive */
export function ensureSeedData(user: User) {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(SEEDED_KEY) === "1" && getListsForUser(user.id).length > 0) {
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
    items: DEMO_SEED_ITEMS.map((item, i) => ({
      ...item,
      id: uid("gift"),
      purchased: i === 0,
      purchasedAt: i === 0 ? now.toISOString() : undefined,
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

  const existing = getLists().filter((l) => l.ownerId !== user.id);
  saveLists([...existing, birthdayList, holidayList]);

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

  saveGiveaways([community, mine, ...getGiveaways().filter((g) => g.ownerId !== user.id && g.ownerId !== "community")]);

  writeJson(ACTIVITY_KEY, [
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
      message: `Shared birthday list with friends`,
      at: now.toISOString(),
      listId: birthdayList.id,
    },
    {
      id: uid("act"),
      type: "claim" as const,
      message: `Someone claimed “Wool beanie” (anonymous)`,
      at: now.toISOString(),
      listId: birthdayList.id,
    },
  ]);

  localStorage.setItem(SEEDED_KEY, "1");
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
  const idx = lists.findIndex((l) => l.id === id);
  if (idx < 0) return null;
  lists[idx] = {
    ...lists[idx],
    ...patch,
    id: lists[idx].id,
    updatedAt: new Date().toISOString(),
  };
  saveLists(lists);
  return lists[idx];
}

export function deleteList(id: string) {
  saveLists(getLists().filter((l) => l.id !== id));
}

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
  updateList(listId, { items: [...list.items, gift] });
  return gift;
}

export function removeItem(listId: string, itemId: string) {
  const list = getListById(listId);
  if (!list) return;
  updateList(listId, { items: list.items.filter((i) => i.id !== itemId) });
}

export function updateItem(
  listId: string,
  itemId: string,
  patch: Partial<
    Pick<GiftItem, "title" | "notes" | "url" | "price" | "imageHint" | "quantity" | "quantityNeeded" | "priority">
  >,
): GiftItem | null {
  const list = getListById(listId);
  if (!list) return null;
  const target = list.items.find((i) => i.id === itemId);
  if (!target || target.purchased) return null;
  const next = { ...target, ...patch };
  updateList(listId, {
    items: list.items.map((i) => (i.id === itemId ? next : i)),
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
  const target = list.items.find((i) => i.id === itemId);
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
  const userLists = getListsForUser(userId);
  const tagSet = new Set<string>();
  userLists.forEach((list) => {
    list.tags?.forEach((tag) => tagSet.add(tag));
  });
  return Array.from(tagSet).sort();
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
  const idx = items.findIndex((g) => g.id === giveawayId);
  if (idx < 0) return null;
  const g = items[idx];
  if (g.status !== "open" || g.entrantIds.includes(userId) || g.ownerId === userId) {
    return g;
  }
  items[idx] = { ...g, entrantIds: [...g.entrantIds, userId] };
  saveGiveaways(items);
  pushActivity({
    type: "giveaway_join",
    message: `Joined giveaway “${g.title}”`,
    giveawayId,
  });
  return items[idx];
}

export function drawGiveaway(giveawayId: string, ownerId: string): Giveaway | null {
  const items = getGiveaways();
  const idx = items.findIndex((g) => g.id === giveawayId);
  if (idx < 0) return null;
  const g = items[idx];
  if (g.ownerId !== ownerId || g.status !== "open" || g.entrantIds.length === 0) {
    return g;
  }
  const winnerId = g.entrantIds[Math.floor(Math.random() * g.entrantIds.length)];
  const winnerName =
    winnerId === getCurrentUser()?.id
      ? getCurrentUser()!.name
      : winnerId.startsWith("neighbor")
        ? `Neighbor ${winnerId.slice(-1)}`
        : "Lucky winner";
  items[idx] = {
    ...g,
    status: "drawn",
    winnerId,
    winnerName,
  };
  saveGiveaways(items);
  pushActivity({
    type: "giveaway_win",
    message: `Drew a winner for “${g.title}”: ${winnerName}`,
    giveawayId,
  });
  return items[idx];
}

export function daysUntil(dateIso: string): number {
  const target = new Date(dateIso);
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatMoney(n?: number): string {
  if (n == null || Number.isNaN(n)) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatShortDate(dateIso: string): string {
  const d = new Date(dateIso.includes("T") ? dateIso : `${dateIso}T12:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
