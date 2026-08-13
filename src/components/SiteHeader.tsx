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
    <header className="shell flex items-center justify-between gap-4 py-5">
      <Link
        href={user ? "/app" : "/"}
        className="group"
        aria-label="Givito home"
      >
        <Logo size="md" />
      </Link>

      <nav className="flex items-center gap-2 sm:gap-3">
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
              title={user.email}
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
              <span className="text-sm text-ink-soft">{user.name}</span>
            </Link>
            <button
              type="button"
              className="btn btn-secondary"
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
