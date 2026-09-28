import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/safe-next";
import { publicRequestOrigin } from "@/lib/site";

function playAppHandoffResponse(code: string, next: string): Response {
  const deepLink = `com.givy.givy://auth/callback?${new URLSearchParams({
    code,
    next,
  }).toString()}`;

  // Chrome Custom Tabs often block HTTP 302 to custom schemes. An HTML
  // interstitial with JS + a manual link is the reliable handoff back into
  // the already-shipped Play shell (flutter_web_auth_2).
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="refresh" content="0;url=${deepLink.replace(/"/g, "&quot;")}" />
  <title>Returning to Givy…</title>
  <style>
    body{font-family:system-ui,sans-serif;background:#FEF6EE;color:#1a1a1a;
      display:grid;place-items:center;min-height:100vh;margin:0;padding:24px;text-align:center}
    a{color:#E8391E;font-weight:600}
  </style>
</head>
<body>
  <main>
    <p>Returning to Givy…</p>
    <p><a id="open" href="${deepLink.replace(/"/g, "&quot;")}">Tap here if the app does not open</a></p>
  </main>
  <script>
    (function () {
      var target = ${JSON.stringify(deepLink)};
      try { window.location.replace(target); } catch (e) {}
      setTimeout(function () {
        try { window.location.href = target; } catch (e2) {}
      }, 250);
    })();
  </script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

/**
 * OAuth callback.
 *
 * Play app flow (website-only fix, no new AAB):
 * 1) Shell opens Google in a Custom Tab with redirect_to =
 *    https://www.givy.gifts/auth/callback?play=1&next=...
 * 2) This route must NOT exchange the code in the Custom Tab (cookies would
 *    stick in Chrome). Instead hand off to com.givy.givy:// so flutter_web_auth_2
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

  if (code && playHandoff) {
    return playAppHandoffResponse(code, next);
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
