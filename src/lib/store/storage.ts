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

const STORAGE_CRYPTO_KEY = "givy.local_crypto_key";
const ENC_PREFIX = "enc:";
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export function uid(prefix = "id"): string {
  const randomPart = crypto
    .getRandomValues(new Uint32Array(1))[0]
    .toString(36)
    .padStart(8, "0")
    .slice(0, 8);
  return `${prefix}_${randomPart}${Date.now().toString(36).slice(-4)}`;
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
  return out;
}

function getOrCreateLocalSecret(): string {
  const existing = localStorage.getItem(STORAGE_CRYPTO_KEY);
  if (existing) return existing;
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const created = toBase64(bytes);
  localStorage.setItem(STORAGE_CRYPTO_KEY, created);
  return created;
}

async function getAesKey(): Promise<CryptoKey> {
  const secret = getOrCreateLocalSecret();
  const keyBytes = fromBase64(secret);
  return crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["encrypt", "decrypt"]);
}

async function encryptString(plainText: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await getAesKey();
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    textEncoder.encode(plainText),
  );
  const cipherBytes = new Uint8Array(encrypted);
  return `${ENC_PREFIX}${toBase64(iv)}:${toBase64(cipherBytes)}`;
}

async function decryptString(payload: string): Promise<string> {
  if (!payload.startsWith(ENC_PREFIX)) return payload;
  const raw = payload.slice(ENC_PREFIX.length);
  const [ivB64, cipherB64] = raw.split(":");
  if (!ivB64 || !cipherB64) throw new Error("Invalid encrypted payload");
  const iv = fromBase64(ivB64);
  const cipherBytes = fromBase64(cipherB64);
  const key = await getAesKey();
  const plainBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    cipherBytes,
  );
  return textDecoder.decode(plainBuffer);
}

export function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    if (!raw.startsWith(ENC_PREFIX)) return JSON.parse(raw) as T;

    let result: T = fallback;
    void decryptString(raw)
      .then((plain) => {
        result = JSON.parse(plain) as T;
      })
      .catch(() => {
        result = fallback;
      });
    return result;
  } catch {
    return fallback;
  }
}

export function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  const serialized = JSON.stringify(value);
  void encryptString(serialized)
    .then((encrypted) => {
      localStorage.setItem(key, encrypted);
    })
    .catch(() => {
      // Avoid writing cleartext if encryption fails.
    });
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
