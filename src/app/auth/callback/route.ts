import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/safe-next";
import { publicRequestOrigin } from "@/lib/site";

/**
 * OAuth callback.
 *
 * Play app flow (website-only fix, no new AAB):
 * 1) Shell opens Google in a Custom Tab with redirect_to =
 *    https://www.givy.gifts/auth/callback?play=1&next=...
 * 2) This route must NOT exchange the code in the Custom Tab (cookies would
 *    stick in Chrome). Instead bounce to com.givy.givy:// so flutter_web_auth_2
 *    returns into the app.
 * 3) The shell then loads this same path WITHOUT play=1 inside the WebView to
 *    finish PKCE with in-app cookies.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = publicRequestOrigin(request);
  const code = searchParams.get("code");
  const playHandoff = searchParams.get("play") === "1";
  const next = safeNextPath(searchParams.get("next"), "/app");
  const requireInvite = process.env.NEXT_PUBLIC_BETA_REQUIRE_INVITE === "true";

  // Return control to the already-shipped Play shell Custom Tab waiter.
  if (code && playHandoff) {
    const q = new URLSearchParams({
      code,
      next,
    });
    return new Response(null, {
      status: 302,
      headers: {
        Location: `com.givy.givy://auth/callback?${q.toString()}`,
        "Cache-Control": "no-store",
      },
    });
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        if (requireInvite) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("beta_unlocked")
            .eq("id", user.id)
            .maybeSingle();
          if (!profile?.beta_unlocked) {
            const dest = safeNextPath(next, "/invite");
            const path = dest.startsWith("/invite") ? dest : "/invite";
            return NextResponse.redirect(`${origin}${path}`);
          }
        }
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
