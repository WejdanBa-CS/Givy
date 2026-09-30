import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { isOutdatedPlayShell } from "@/lib/play-version";
import { CANONICAL_HOST, isLegacyPublicHost } from "@/lib/site";

function canonicalHostRedirect(request: NextRequest): NextResponse | null {
  if (process.env.NODE_ENV !== "production") return null;
  const host = request.headers.get("host");
  if (!isLegacyPublicHost(host)) return null;
  const url = request.nextUrl.clone();
  url.protocol = "https:";
  url.hostname = CANONICAL_HOST;
  url.port = "";
  return NextResponse.redirect(url, 308);
}

export async function middleware(request: NextRequest) {
  const canonical = canonicalHostRedirect(request);
  if (canonical) return canonical;

  const { pathname } = request.nextUrl;
  // Always allow the update screen + version manifest through.
  if (
    pathname === "/update-required" ||
    pathname === "/play-min-version.json"
  ) {
    return updateSession(request);
  }

  const ua = request.headers.get("user-agent");
  if (isOutdatedPlayShell(ua)) {
    const url = request.nextUrl.clone();
    url.pathname = "/update-required";
    url.search = "";
    return NextResponse.redirect(url, 307);
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|play-min-version.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
