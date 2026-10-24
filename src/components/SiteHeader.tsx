"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { UserAvatar } from "@/components/UserAvatar";
import { useGivy } from "@/lib/givy-context";

export function SiteHeader() {
  const { user, signOut, ready } = useGivy();
  const pathname = usePathname();
  const router = useRouter();
  const isApp = pathname.startsWith("/app") || pathname.startsWith("/create");

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-mist/90 backdrop-blur-md">
      <div className="shell flex items-center justify-between gap-3 py-4 pt-[max(1rem,calc(env(safe-area-inset-top,0px)+0.75rem))] sm:gap-4">
        <Link
          href={user ? "/app" : "/"}
          className="group min-w-0"
          aria-label="Givy home"
        >
          <Logo size="md" />
        </Link>

        <nav className="flex shrink-0 items-center gap-2 sm:gap-3">
          {ready && user ? (
            <>
              {!isApp && (
                <Link href="/app" className="btn btn-ghost hidden sm:inline-flex">
                  My lists
                </Link>
              )}
              <Link
                href="/app/profile"
                className="hidden items-center gap-2 rounded-full ring-2 ring-line transition hover:ring-coral/40 sm:flex"
                title={
                  user.provider === "guest"
                    ? "Demo · this browser only"
                    : user.email
                }
              >
                <UserAvatar
                  name={user.name}
                  hue={user.avatarHue}
                  src={user.avatarUrl}
                  size="sm"
                />
                <span className="max-w-[10rem] truncate pr-2 text-sm font-semibold text-ink-soft">
                  {user.name}
                </span>
              </Link>
              <button
                type="button"
                className="btn btn-secondary !min-h-10 !px-4 text-sm"
                onClick={() => {
                  void signOut().then(() => router.replace("/"));
                }}
              >
                Sign out
              </button>
            </>
          ) : pathname === "/login" ? null : (
            <Link href="/login" className="btn btn-secondary !min-h-10 !px-4 text-sm">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
