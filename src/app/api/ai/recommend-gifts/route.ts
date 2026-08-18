import { NextResponse } from "next/server";
import {
  allowRecommendRequest,
  parseRecommendBody,
  recommendGifts,
  RECOMMEND_LIMITS,
} from "@/lib/ai/recommend-gifts";
import { createClient } from "@/lib/supabase/server";
import { siteOriginSet } from "@/lib/site";

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
  return siteOriginSet();
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
          { error: "Sign in to get AI gift recommendations." },
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
            { error: "Invite required for AI gift recommendations." },
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

  if (!allowRecommendRequest(clientKey(req, userId))) {
    return NextResponse.json(
      { error: "Too many recommendations. Try again in a minute." },
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

  const parsed = parseRecommendBody(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  if (parsed.count > RECOMMEND_LIMITS.countMax) {
    return NextResponse.json({ error: "count too large" }, { status: 400 });
  }

  const result = await recommendGifts(parsed);
  return NextResponse.json(result);
}
