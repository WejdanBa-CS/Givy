import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function configured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  if (!configured()) {
    return supabaseResponse;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isApp = path.startsWith("/app");
  const requireInvite = process.env.NEXT_PUBLIC_BETA_REQUIRE_INVITE === "true";

  // Mirror src/lib/guest.ts isGuestAllowed() (server-side).
  // Guest never skips invite; with cloud auth, guest is opt-in only.
  const guestExplicitlyOn = process.env.NEXT_PUBLIC_ALLOW_GUEST === "true";
  const guestAllowed = !requireInvite && guestExplicitlyOn;
  const hasGuestCookie = request.cookies.get("givy_guest")?.value === "1";
  const isGuest = guestAllowed && hasGuestCookie;

  if (isApp && hasGuestCookie && !guestAllowed) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/login";
    redirect.searchParams.set("next", path);
    const res = NextResponse.redirect(redirect);
    res.cookies.set("givy_guest", "", { path: "/", maxAge: 0 });
    return res;
  }

  // Guest testers skip OAuth / email — session lives in the browser only.
  if (isApp && !user && !isGuest) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/login";
    redirect.searchParams.set("next", path);
    return NextResponse.redirect(redirect);
  }

  if (isApp && user && requireInvite) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("beta_unlocked")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.beta_unlocked) {
      const redirect = request.nextUrl.clone();
      redirect.pathname = "/invite";
      return NextResponse.redirect(redirect);
    }
  }

  return supabaseResponse;
}
