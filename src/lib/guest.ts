/** Cookie that lets guest testers reach /app without OAuth / email. */
export const GUEST_COOKIE = "givy_guest";

export function setGuestCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${GUEST_COOKIE}=1; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`;
}

export function clearGuestCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${GUEST_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function isGuestUser(user: { provider: string } | null | undefined) {
  return user?.provider === "guest";
}
