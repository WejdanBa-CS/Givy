import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/app";
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
            return NextResponse.redirect(`${origin}/invite`);
          }
        }
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
