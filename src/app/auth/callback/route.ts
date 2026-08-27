import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/safe-next";
import { publicRequestOrigin } from "@/lib/site";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = publicRequestOrigin(request);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"), "/app");
  const requireInvite = process.env.NEXT_PUBLIC_BETA_REQUIRE_INVITE === "true";

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
