"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { useGivy } from "@/lib/givy-context";

export function SiteHeader() {
  const { user, signOut, ready } = useGivy();
  const pathname = usePathname();
  const router = useRouter();
  const isApp = pathname.startsWith("/app") || pathname.startsWith("/create");

  return (
    <header className="shell flex items-center justify-between gap-3 py-4 pt-[max(1.75rem,calc(env(safe-area-inset-top,0px)+1rem))] sm:gap-4 sm:py-5 sm:pt-[max(2rem,calc(env(safe-area-inset-top,0px)+1.15rem))] lg:py-6">
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
              className="hidden items-center gap-2 sm:flex"
              title={
                user.provider === "guest"
                  ? "Demo · this browser only"
                  : user.email
              }
            >
              <span
                className="grid h-8 w-8 place-items-center rounded-full text-xs font-bold text-white"
                style={{ background: `hsl(${user.avatarHue} 55% 42%)` }}
              >
                {user.name
                  .split(" ")
                  .map((p) => p[0])
                  .join("")
                  .slice(0, 2)}
              </span>
              <span className="max-w-[10rem] truncate text-sm text-ink-soft">
                {user.name}
              </span>
            </Link>
            <button
              type="button"
              className="btn btn-secondary !px-3 !py-2 text-sm sm:!px-[1.35rem] sm:!py-[0.85rem] sm:text-base"
              onClick={() => {
                void signOut().then(() => router.replace("/"));
              }}
            >
              Sign out
            </button>
          </>
        ) : (
          <Link href="/login" className="btn btn-primary">
            Sign in
          </Link>
        )}
      </nav>
    </header>
  );
}
