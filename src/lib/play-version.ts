/** Play shell user-agent token, e.g. `GivyPlayApp/1.1.5`. */
export const PLAY_UA_TOKEN = "GivyPlayApp";

/** Default floor — keep in sync with `public/play-min-version.json`. */
export const DEFAULT_PLAY_MIN_VERSION = "1.1.5";

export function playMinVersionName(): string {
  return (
    process.env.PLAY_MIN_VERSION?.trim() ||
    process.env.NEXT_PUBLIC_PLAY_MIN_VERSION?.trim() ||
    DEFAULT_PLAY_MIN_VERSION
  );
}

export function isGivyPlayUserAgent(ua: string | null | undefined): boolean {
  return Boolean(ua && new RegExp(PLAY_UA_TOKEN, "i").test(ua));
}

/** Returns semver from `GivyPlayApp/1.2.3`, or null if absent. */
export function parseGivyPlayVersion(
  ua: string | null | undefined,
): string | null {
  if (!ua) return null;
  const match = ua.match(/GivyPlayApp\/(\d+\.\d+\.\d+)/i);
  return match?.[1] ?? null;
}

/** Compare `a` vs `b` semver. Negative if a < b. */
export function compareSemver(a: string, b: string): number {
  const pa = a.split(".").map((n) => Number.parseInt(n, 10) || 0);
  const pb = b.split(".").map((n) => Number.parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const da = pa[i] ?? 0;
    const db = pb[i] ?? 0;
    if (da !== db) return da < db ? -1 : 1;
  }
  return 0;
}

/**
 * True when this request is the Play WebView shell and below the minimum
 * supported version. Missing/legacy `GivyPlayApp/1.0.0` counts as outdated.
 */
export function isOutdatedPlayShell(
  ua: string | null | undefined,
  minVersion = playMinVersionName(),
): boolean {
  if (!isGivyPlayUserAgent(ua)) return false;
  const current = parseGivyPlayVersion(ua) ?? "0.0.0";
  return compareSemver(current, minVersion) < 0;
}
