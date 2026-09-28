import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/safe-next";
import { publicRequestOrigin } from "@/lib/site";

function playAppHandoffResponse(code: string, next: string): Response {
  const qs = new URLSearchParams({ code, next }).toString();
  const deepLink = `com.givy.givy://auth/callback?${qs}`;
  // Chrome handles intent:// more reliably than bare custom schemes.
  const intentLink = `intent://auth/callback?${qs}#Intent;scheme=com.givy.givy;package=com.givy.givy;end`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Returning to Givy…</title>
  <style>
    body{font-family:system-ui,sans-serif;background:#FEF6EE;color:#1a1a1a;
      display:grid;place-items:center;min-height:100vh;margin:0;padding:24px;text-align:center}
    a{display:inline-block;margin-top:12px;padding:12px 18px;border-radius:999px;
      background:#E8391E;color:#fff;font-weight:700;text-decoration:none}
  </style>
</head>
<body>
  <main>
    <p>Returning to Givy…</p>
    <p><a id="open" href="${intentLink.replace(/"/g, "&quot;")}">Open Givy</a></p>
  </main>
  <script>
    (function () {
      var intent = ${JSON.stringify(intentLink)};
      var deep = ${JSON.stringify(deepLink)};
      function go(url) {
        try { window.location.replace(url); } catch (e) {
          try { window.location.href = url; } catch (e2) {}
        }
      }
      go(intent);
      setTimeout(function () { go(deep); }, 400);
      setTimeout(function () { go(intent); }, 900);
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
 * Play app flow (website-only, no new AAB):
 * Custom Tab lands here with play=1 → HTML handoff into com.givy.givy://
 * → live shell finishes PKCE inside the WebView without play=1.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = publicRequestOrigin(request);
  const code = searchParams.get("code");
  const playHandoff = searchParams.get("play") === "1";
  const next = safeNextPath(searchParams.get("next"), "/app");
  const requireInvite = process.env.NEXT_PUBLIC_BETA_REQUIRE_INVITE === "true";
  const ua = request.headers.get("user-agent") ?? "";
  const alreadyInPlayWebView = /GivyPlayApp/i.test(ua);

  // Handoff only when Chrome/Custom Tab has the code — not when the Play
  // WebView itself already loaded this URL (App Link / in-app resume).
  if (code && playHandoff && !alreadyInPlayWebView) {
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
