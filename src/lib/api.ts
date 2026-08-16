import { customAlphabet } from "nanoid";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { safeHttpsUrl, safeSupportUrl } from "@/lib/security";
import { safeNextPath } from "@/lib/safe-next";
import type {
  AuthProvider,
  GiftItem,
  GivyList,
  Occasion,
  ShipPreference,
  User,
} from "@/lib/types";
import { DEMO_SEED_ITEMS } from "@/lib/types";

function sanitizeItemUrl(url?: string | null): string | null {
  if (!url) return null;
  const https = safeHttpsUrl(url);
  if (!https) {
    throw new Error("Gift links must use https://");
  }
  return https;
}

function sanitizeSupportUrl(url?: string | null): string | null {
  if (url == null || url === "") return null;
  return safeSupportUrl(url);
}
const shareCode = customAlphabet("abcdefghjkmnpqrstuvwxyz23456789", 10);

export type ClaimResult = {
  ok: boolean;
  recipientAddress?: string | null;
  ownerName?: string;
  shipPreference?: string;
  error?: string;
};

type ListRow = {
  id: string;
  owner_id: string;
  title: string;
  occasion: string;
  description: string | null;
  event_date: string;
  recipient_address: string | null;
  support_url: string | null;
  support_label: string | null;
  share_code: string;
  published: boolean;
  created_at: string;
  updated_at: string;
  profiles?: { display_name: string } | { display_name: string }[] | null;
};

type ItemRow = {
  id: string;
  list_id: string;
  title: string;
  notes: string | null;
  url: string | null;
  price: number | string | null;
  image_url: string | null;
  emoji: string | null;
  is_claimed: boolean;
  created_at: string;
};

function ownerNameFrom(row: ListRow): string {
  const p = row.profiles;
  if (!p) return "Someone";
  if (Array.isArray(p)) return p[0]?.display_name ?? "Someone";
  return p.display_name ?? "Someone";
}

function mapItem(row: ItemRow, claimedByMe = false): GiftItem {
  return {
    id: row.id,
    title: row.title,
    notes: row.notes ?? undefined,
    url: row.url ?? undefined,
    price: row.price == null ? undefined : Number(row.price),
    imageHint: row.image_url ?? row.emoji ?? undefined,
    purchased: row.is_claimed,
    claimedByMe,
  };
}

function mapList(row: ListRow, items: GiftItem[]): GivyList {
  return {
    id: row.id,
    ownerId: row.owner_id,
    ownerName: ownerNameFrom(row),
    title: row.title,
    occasion: row.occasion as Occasion,
    description: row.description ?? undefined,
    eventDate: row.event_date,
    recipientAddress: row.recipient_address ?? undefined,
    supportUrl: row.support_url ?? undefined,
    supportLabel: row.support_label ?? undefined,
    shareCode: row.share_code,
    published: row.published,
    items,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export { isSupabaseConfigured };

export async function fetchSessionUser(): Promise<User | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, email, avatar_hue, beta_unlocked")
    .eq("id", user.id)
    .maybeSingle();

  const providerRaw =
    (user.app_metadata?.provider as string | undefined) ??
    (user.identities?.[0]?.provider as string | undefined) ??
    "email";
  const provider: AuthProvider =
    providerRaw === "facebook" ||
    providerRaw === "apple" ||
    providerRaw === "google" ||
    providerRaw === "guest" ||
    providerRaw === "email"
      ? providerRaw
      : "email";

  return {
    id: user.id,
    name: profile?.display_name ?? user.user_metadata?.full_name ?? "Givy user",
    email: profile?.email ?? user.email ?? "",
    provider,
    avatarHue: profile?.avatar_hue ?? 180,
    betaUnlocked: Boolean(profile?.beta_unlocked),
  };
}

/** Play WebView shell appends this token to its user-agent. */
function isGivyPlayApp(): boolean {
  if (typeof navigator === "undefined") return false;
  return /GivyPlayApp/i.test(navigator.userAgent);
}

export async function signInWithOAuth(
  provider: "google" | "facebook" | "apple",
  next = "/app",
) {
  const supabase = createClient();
  const origin = window.location.origin;
  const safeNext = safeNextPath(next, "/app");
  const playApp = isGivyPlayApp();
  // Custom scheme returns into the Android shell so PKCE cookies in the WebView
  // can finish /auth/callback (Chrome Custom Tabs cannot share that jar).
  const redirectTo = playApp
    ? `com.givy.givy://auth/callback?next=${encodeURIComponent(safeNext)}`
    : `${origin}/auth/callback?next=${encodeURIComponent(safeNext)}`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: playApp,
    },
  });
  if (error) throw error;
  if (playApp && data.url) {
    window.location.assign(data.url);
  }
}

export type EmailAuthResult = {
  /** True when signup succeeded but email confirmation is required. */
  needsEmailConfirm?: boolean;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function assertEmailPassword(email: string, password: string) {
  const normalized = normalizeEmail(email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error("Enter a valid email address.");
  }
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }
  return normalized;
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<void> {
  const supabase = createClient();
  const normalized = assertEmailPassword(email, password);
  const { error } = await supabase.auth.signInWithPassword({
    email: normalized,
    password,
  });
  if (error) throw new Error(error.message);
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName?: string,
): Promise<EmailAuthResult> {
  const supabase = createClient();
  const normalized = assertEmailPassword(email, password);
  const origin = window.location.origin;
  const { data, error } = await supabase.auth.signUp({
    email: normalized,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/app")}`,
      data: {
        full_name: displayName?.trim() || normalized.split("@")[0],
        name: displayName?.trim() || normalized.split("@")[0],
      },
    },
  });
  if (error) throw new Error(error.message);
  if (!data.session) {
    return { needsEmailConfirm: true };
  }
  return {};
}

/** @deprecated Prefer signInWithOAuth("google") */
export async function signInWithGoogle(next = "/app") {
  return signInWithOAuth("google", next);
}

export async function signOutRemote() {
  if (!isSupabaseConfigured()) return;
  const supabase = createClient();
  await supabase.auth.signOut();
}

export async function redeemInvite(code: string) {
  const supabase = createClient();
  const normalized = code.trim();
  if (!normalized) throw new Error("Enter an invite code.");
  const { error } = await supabase.rpc("redeem_invite", {
    invite_code: normalized,
  });
  if (error) throw new Error(error.message);
}

export async function fetchMyLists(
  userId: string,
  ownerName: string,
): Promise<GivyList[]> {
  const supabase = createClient();
  const { data: lists, error } = await supabase
    .from("lists")
    .select("*")
    .eq("owner_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  if (!lists?.length) return [];

  const ids = lists.map((l) => l.id);
  const { data: items, error: itemsError } = await supabase
    .from("items")
    .select("*")
    .in("list_id", ids)
    .order("created_at", { ascending: true });

  if (itemsError) throw itemsError;

  const byList = new Map<string, GiftItem[]>();
  for (const item of items ?? []) {
    const arr = byList.get(item.list_id) ?? [];
    arr.push(mapItem(item as ItemRow));
    byList.set(item.list_id, arr);
  }

  return (lists as ListRow[]).map((row) =>
    mapList(
      { ...row, profiles: { display_name: ownerName } },
      byList.get(row.id) ?? [],
    ),
  );
}

export async function createListRemote(input: {
  owner: User;
  title: string;
  occasion: Occasion;
  description?: string;
  eventDate: string;
  recipientAddress?: string;
  supportUrl?: string;
  supportLabel?: string;
  withDemoItems?: boolean;
}): Promise<GivyList> {
  const supabase = createClient();
  const { data: list, error } = await supabase
    .from("lists")
    .insert({
      owner_id: input.owner.id,
      title: input.title,
      occasion: input.occasion,
      description: input.description ?? null,
      event_date: input.eventDate,
      recipient_address: input.recipientAddress ?? null,
      support_url: sanitizeSupportUrl(input.supportUrl ?? null),
      support_label: input.supportLabel ?? null,
      share_code: shareCode(),
      published: false,
    })
    .select("*")
    .single();

  if (error) throw error;

  let gifts: GiftItem[] = [];
  if (input.withDemoItems) {
    const rows = DEMO_SEED_ITEMS.map((d) => ({
      list_id: list.id,
      title: d.title,
      notes: d.notes ?? null,
      url: sanitizeItemUrl(d.url),
      price: d.price ?? null,
      image_url: sanitizeItemUrl(d.imageHint),
      emoji: null,
      is_claimed: false,
    }));
    const { data: inserted, error: itemErr } = await supabase
      .from("items")
      .insert(rows)
      .select("*");
    if (itemErr) throw itemErr;
    gifts = (inserted as ItemRow[]).map((r) => mapItem(r));
  }

  return mapList(
    {
      ...(list as ListRow),
      profiles: { display_name: input.owner.name },
    },
    gifts,
  );
}

export async function updateListRemote(
  id: string,
  patch: Partial<GivyList>,
): Promise<void> {
  const supabase = createClient();
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.title !== undefined) payload.title = patch.title;
  if (patch.occasion !== undefined) payload.occasion = patch.occasion;
  if (patch.description !== undefined) payload.description = patch.description;
  if (patch.eventDate !== undefined) payload.event_date = patch.eventDate;
  if (patch.recipientAddress !== undefined) {
    payload.recipient_address = patch.recipientAddress;
  }
  if (patch.supportUrl !== undefined) {
    payload.support_url = sanitizeSupportUrl(patch.supportUrl || null);
  }
  if (patch.supportLabel !== undefined) {
    payload.support_label = patch.supportLabel || null;
  }
  if (patch.published !== undefined) payload.published = patch.published;

  const { error } = await supabase.from("lists").update(payload).eq("id", id);
  if (error) throw error;
}

export async function deleteListRemote(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("lists").delete().eq("id", id);
  if (error) throw error;
}

export async function addItemRemote(
  listId: string,
  item: Omit<GiftItem, "id" | "purchased" | "purchasedAt" | "claimedByMe">,
): Promise<GiftItem> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("items")
    .insert({
      list_id: listId,
      title: item.title,
      notes: item.notes ?? null,
      url: sanitizeItemUrl(item.url),
      price: item.price ?? null,
      image_url: sanitizeItemUrl(item.imageHint),
      is_claimed: false,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapItem(data as ItemRow);
}

export async function removeItemRemote(
  listId: string,
  itemId: string,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("items")
    .delete()
    .eq("id", itemId)
    .eq("list_id", listId);
  if (error) throw error;
}

export async function updateItemRemote(
  listId: string,
  itemId: string,
  patch: Partial<
    Pick<GiftItem, "title" | "notes" | "url" | "price" | "imageHint">
  >,
): Promise<GiftItem> {
  const supabase = createClient();
  const payload: Record<string, unknown> = {};
  if (patch.title !== undefined) payload.title = patch.title;
  if (patch.notes !== undefined) payload.notes = patch.notes ?? null;
  if (patch.url !== undefined) payload.url = sanitizeItemUrl(patch.url);
  if (patch.price !== undefined) payload.price = patch.price ?? null;
  if (patch.imageHint !== undefined) {
    payload.image_url = sanitizeItemUrl(patch.imageHint);
  }

  const { data, error } = await supabase
    .from("items")
    .update(payload)
    .eq("id", itemId)
    .eq("list_id", listId)
    .eq("is_claimed", false)
    .select("*")
    .single();
  if (error) throw error;
  return mapItem(data as ItemRow);
}

export async function publishListRemote(listId: string): Promise<void> {
  await updateListRemote(listId, { published: true });
}

export async function fetchPublicList(
  code: string,
): Promise<GivyList | null> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_public_list", {
    p_share_code: code,
  });
  if (error) throw error;
  if (!data) return null;

  const payload = data as {
    id: string;
    title: string;
    occasion: string;
    description: string | null;
    event_date: string;
    share_code: string;
    owner_name: string;
    support_url?: string | null;
    support_label?: string | null;
    has_recipient_address?: boolean;
    items: Array<{
      id: string;
      title: string;
      notes: string | null;
      url: string | null;
      price: number | null;
      image_url: string | null;
      emoji: string | null;
      is_claimed: boolean;
      claimed_by_me?: boolean;
    }>;
  };

  return {
    id: payload.id,
    ownerId: "",
    ownerName: payload.owner_name,
    title: payload.title,
    occasion: payload.occasion as Occasion,
    description: payload.description ?? undefined,
    eventDate: payload.event_date,
    shareCode: payload.share_code,
    published: true,
    // Never expose address on public fetch
    recipientAddress: undefined,
    supportUrl: payload.support_url ?? undefined,
    supportLabel: payload.support_label ?? undefined,
    hasRecipientAddress: Boolean(payload.has_recipient_address),
    createdAt: "",
    updatedAt: "",
    items: (payload.items ?? []).map((i) => ({
      id: i.id,
      title: i.title,
      notes: i.notes ?? undefined,
      url: i.url ?? undefined,
      price: i.price == null ? undefined : Number(i.price),
      imageHint: i.image_url ?? i.emoji ?? undefined,
      purchased: i.is_claimed,
      claimedByMe: Boolean(i.claimed_by_me),
    })),
  };
}

export async function claimItemRemote(
  itemId: string,
  shipPreference: ShipPreference,
): Promise<ClaimResult> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("claim_item", {
    p_item_id: itemId,
    p_ship_preference: shipPreference,
  });
  if (error) {
    return { ok: false, error: error.message };
  }
  const result = data as {
    ok: boolean;
    recipient_address?: string | null;
    owner_name?: string;
  };
  return {
    ok: Boolean(result?.ok),
    recipientAddress: result?.recipient_address ?? null,
    ownerName: result?.owner_name,
  };
}

export function formatMoney(value?: number) {
  if (value == null || Number.isNaN(value)) return "-";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
