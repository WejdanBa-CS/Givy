/** Cookie that lets guest testers reach /app without OAuth / email. */
export const GUEST_COOKIE = "givy_guest";

/**
 * Guest mode is opt-in and never allowed when closed-beta invite is required.
 * Local demo (no Supabase) still allows guest so offline testing works.
 */
export function isGuestAllowed(): boolean {
  const requireInvite = process.env.NEXT_PUBLIC_BETA_REQUIRE_INVITE === "true";
  if (requireInvite) return false;

  if (process.env.NEXT_PUBLIC_ALLOW_GUEST === "true") return true;
  if (process.env.NEXT_PUBLIC_ALLOW_GUEST === "false") return false;

  const cloudConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  return !cloudConfigured;
}

export function setGuestCookie() {
  if (typeof document === "undefined") return;
  if (!isGuestAllowed()) return;
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; Secure"
      : "";
  document.cookie = `${GUEST_COOKIE}=1; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax${secure}`;
}

export function clearGuestCookie() {
  if (typeof document === "undefined") return;
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; Secure"
      : "";
  document.cookie = `${GUEST_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}

export function isGuestUser(user: { provider: string } | null | undefined) {
  return user?.provider === "guest";
}
