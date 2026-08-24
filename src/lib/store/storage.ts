import type { ActivityEvent } from "../types";

export const STORAGE_KEYS = {
  user: "givy.user",
  users: "givy.users",
  emailAccounts: "givy.email_accounts",
  lists: "givy.lists",
  giveaways: "givy.giveaways",
  activity: "givy.activity",
  seeded: "givy.seeded",
} as const;

export function uid(prefix = "id"): string {
  const randomPart = crypto
    .getRandomValues(new Uint32Array(1))[0]
    .toString(36)
    .padStart(8, "0")
    .slice(0, 8);
  return `${prefix}_${randomPart}${Date.now().toString(36).slice(-4)}`;
}

export function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  // Local browser demo only. Cloud mode stores data in Supabase (RLS), not here.
  // codeql[js/clear-text-storage-of-sensitive-data]
  localStorage.setItem(key, JSON.stringify(value));
}

export function getActivity(): ActivityEvent[] {
  return readJson<ActivityEvent[]>(STORAGE_KEYS.activity, []);
}

export function pushActivity(event: Omit<ActivityEvent, "id" | "at">) {
  const events = getActivity();
  events.unshift({
    ...event,
    id: uid("act"),
    at: new Date().toISOString(),
  });
  writeJson(STORAGE_KEYS.activity, events.slice(0, 40));
}
