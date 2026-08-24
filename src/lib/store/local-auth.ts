import type { AuthProvider, User } from "../types";
import { getGiveaways, saveGiveaways } from "./local-giveaways";
import { getLists, saveLists } from "./local-lists";
import { ensureSeedData } from "./seed";
import { readJson, STORAGE_KEYS, uid, writeJson } from "./storage";

type LocalEmailAccount = {
  password: string;
  user: User;
};

function getSecureRandomInt(maxExclusive: number): number {
  if (!Number.isSafeInteger(maxExclusive) || maxExclusive <= 0) {
    throw new Error("maxExclusive must be a positive safe integer.");
  }

  const maxUint32 = 0x100000000; // 2^32
  const limit = Math.floor(maxUint32 / maxExclusive) * maxExclusive;
  const buffer = new Uint32Array(1);

  let value: number;
  do {
    crypto.getRandomValues(buffer);
    value = buffer[0];
  } while (value >= limit);

  return value % maxExclusive;
}

export function getCurrentUser(): User | null {
  const user = readJson<User | null>(STORAGE_KEYS.user, null);
  if (!user || user.provider !== "guest") return user;
  if (user.name !== "Guest" && !user.name.startsWith("Guest")) return user;

  const updated: User = { ...user, name: "Alex" };
  writeJson(STORAGE_KEYS.user, updated);

  saveLists(
    getLists().map((list) => {
      if (list.ownerId !== user.id) return list;
      const title =
        list.title === "Guest's birthday" || list.title.startsWith("Guest's ")
          ? list.title.replace(/^Guest/, "Alex")
          : list.title;
      return { ...list, ownerName: "Alex", title };
    }),
  );
  saveGiveaways(
    getGiveaways().map((giveaway) =>
      giveaway.ownerId === user.id ? { ...giveaway, ownerName: "Alex" } : giveaway,
    ),
  );

  return updated;
}

export function signIn(provider: AuthProvider): User {
  const saved = readJson<Record<string, User>>(STORAGE_KEYS.users, {});
  if (saved[provider]) {
    const existing = saved[provider];
    const user =
      provider === "guest" && !existing.betaUnlocked
        ? { ...existing, betaUnlocked: true, email: "" }
        : existing;
    if (user !== existing) {
      saved[provider] = user;
      writeJson(STORAGE_KEYS.users, saved);
    }
    writeJson(STORAGE_KEYS.user, user);
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
    avatarHue: getSecureRandomInt(360),
    betaUnlocked: provider === "guest" ? true : undefined,
  };
  saved[provider] = user;
  writeJson(STORAGE_KEYS.users, saved);
  writeJson(STORAGE_KEYS.user, user);
  ensureSeedData(user);
  return user;
}

export function signOut() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.user);
}

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
    STORAGE_KEYS.emailAccounts,
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
      avatarHue: getSecureRandomInt(360),
    };
    accounts[normalized] = { password, user };
    writeJson(STORAGE_KEYS.emailAccounts, accounts);
    writeJson(STORAGE_KEYS.user, user);
    ensureSeedData(user);
    return user;
  }

  if (!existing || existing.password !== password) {
    throw new Error("Invalid email or password.");
  }
  writeJson(STORAGE_KEYS.user, existing.user);
  ensureSeedData(existing.user);
  return existing.user;
}
