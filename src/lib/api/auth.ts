import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { normalizeInviteCode } from "@/lib/security";
import { safeNextPath } from "@/lib/safe-next";
import type { AuthProvider, User } from "@/lib/types";

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

type GivyOAuthBridge = { postMessage: (message: string) => void };

export function playOAuthBridge(): GivyOAuthBridge | null {
  if (typeof window === "undefined") return null;
  const bridge = (window as unknown as { GivyOAuth?: GivyOAuthBridge }).GivyOAuth;
  return bridge?.postMessage ? bridge : null;
}

export async function signInWithOAuth(
  provider: "google" | "facebook" | "apple",
  next = "/app",
) {
  const supabase = createClient();
  const origin = window.location.origin;
  const safeNext = safeNextPath(next, "/app");
  const bridge = playOAuthBridge();
  const playApp = isGivyPlayApp() && bridge != null;
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
  if (playApp && data.url && bridge) {
    bridge.postMessage(JSON.stringify({ url: data.url, next: safeNext }));
  }
}

export type EmailAuthResult = {
  /** True when signup succeeded but email confirmation is required. */
  needsEmailConfirm?: boolean;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function assertEmailPassword(email: string, password: string): string {
  const normalized = normalizeEmail(email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error("Enter a valid email address.");
  }
  if (password.length < 8) throw new Error("Password must be at least 8 characters.");
  return normalized;
}

export async function signInWithEmail(email: string, password: string): Promise<void> {
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
  return data.session ? {} : { needsEmailConfirm: true };
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
  const normalized = normalizeInviteCode(code);
  if (!normalized) throw new Error("Enter a valid invite code.");
  const { error } = await supabase.rpc("redeem_invite", { invite_code: normalized });
  if (error) throw new Error(error.message);
}
