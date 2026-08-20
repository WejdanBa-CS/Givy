/**
 * Shared API hardening (OWASP: CSRF surface reduction, rate limits, SSRF guards).
 */

import { siteOriginSet } from "@/lib/site";

const ALLOWED_AI_HOSTS = new Set([
  "api.openai.com",
  "api.groq.com",
]);

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Same-site Origin / Referer check for state-changing API routes. */
export function originAllowed(req: Request): boolean {
  const allowed = siteOriginSet();
  const origin = req.headers.get("origin");
  if (origin) return allowed.has(origin);
  const referer = req.headers.get("referer");
  if (!referer) return false;
  try {
    return allowed.has(new URL(referer).origin);
  } catch {
    return false;
  }
}

export function forbiddenOriginResponse(): Response {
  return Response.json({ error: "Forbidden origin" }, { status: 403 });
}

/** Stable key for per-user or per-IP rate buckets. */
export function clientKey(req: Request, userId?: string): string {
  if (userId) return `u:${userId}`;
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return `ip:${fwd.split(",")[0]?.trim() || "anon"}`;
  return `ip:${req.headers.get("x-real-ip") || "anon"}`;
}

/** Process-local sliding window limiter (use Postgres limits for abuse-critical RPCs). */
export function allowRate(
  key: string,
  max: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= max) return false;
  bucket.count += 1;
  return true;
}

/** Block misconfigured OPENAI_BASE_URL (SSRF if env is tampered). */
export function resolveAiBaseUrl(): string {
  const raw = (
    process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1"
  ).replace(/\/$/, "");
  try {
    const host = new URL(raw).hostname.toLowerCase();
    if (!ALLOWED_AI_HOSTS.has(host)) {
      throw new Error(`Disallowed OPENAI_BASE_URL host: ${host}`);
    }
    return raw;
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Disallowed")) throw err;
    throw new Error("Invalid OPENAI_BASE_URL");
  }
}
