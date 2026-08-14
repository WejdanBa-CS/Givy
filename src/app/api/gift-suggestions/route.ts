import { NextResponse } from "next/server";
import {
  allowSuggestRequest,
  parseSuggestBody,
  suggestGifts,
  SUGGEST_LIMITS,
} from "@/lib/gift-suggest";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function supabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
  );
}
function clientKey(req: Request, userId?: string): string {
  if (userId) return `u:${userId}`;
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return `ip:${fwd.split(",")[0]?.trim() || "anon"}`;
  return `ip:${req.headers.get("x-real-ip") || "anon"}`;
}

function allowedOrigins(): Set<string> {
  const set = new Set<string>([
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:10000",
    "http://127.0.0.1:10000",
  ]);
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  if (site) {
    try {
      set.add(new URL(site).origin);
    } catch {
      /* ignore bad SITE_URL */
    }
  }
  return set;
}

function originAllowed(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (origin) return allowedOrigins().has(origin);
  const referer = req.headers.get("referer");
  if (!referer) return false;
  try {
    return allowedOrigins().has(new URL(referer).origin);
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  if (!originAllowed(req)) {
    return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
  }

  const aiEnabled = Boolean(process.env.OPENAI_API_KEY?.trim());
  let userId: string | undefined;

  if (aiEnabled || supabaseConfigured()) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json(
          { error: "Sign in to get gift suggestions." },
          { status: 401 },
        );
      }
      userId = user.id;

      const requireBeta =
        aiEnabled ||
        process.env.NEXT_PUBLIC_BETA_REQUIRE_INVITE === "true";
      if (requireBeta) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("beta_unlocked")
          .eq("id", user.id)
          .maybeSingle();
        if (!profile?.beta_unlocked) {
          return NextResponse.json(
            { error: "Invite required for gift suggestions." },
            { status: 403 },
          );
        }
      }
    } catch {
      if (aiEnabled) {
        return NextResponse.json(
          { error: "Auth unavailable" },
          { status: 503 },
        );
      }
    }
  }

  if (!allowSuggestRequest(clientKey(req, userId))) {
    return NextResponse.json(
      { error: "Too many suggestions. Try again in a minute." },
      { status: 429 },
    );
  }

  const contentLength = Number(req.headers.get("content-length") || 0);
  if (contentLength > 4096) {
    return NextResponse.json({ error: "Request too large" }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parseSuggestBody(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  if (parsed.interests.length > SUGGEST_LIMITS.interestsMax) {
    return NextResponse.json({ error: "Interests too long" }, { status: 400 });
  }

  const result = await suggestGifts(parsed);
  return NextResponse.json(result);
}
