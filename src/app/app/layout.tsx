"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppNav } from "@/components/AppNav";
import { Logo } from "@/components/Logo";
import { useGivy } from "@/lib/givy-context";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { ready, user } = useGivy();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  if (!ready || !user) {
    return (
      <div className="shell grid min-h-[70vh] place-items-center text-ink-soft">
        Opening…
      </div>
    );
  }

  const showNav =
    pathname === "/app" ||
    pathname.startsWith("/app/lists") ||
    pathname.startsWith("/app/create") ||
    pathname.startsWith("/app/profile") ||
    pathname.startsWith("/app/activity") ||
    pathname.startsWith("/app/giveaways") ||
    /^\/app\/[^/]+$/.test(pathname);

  return (
    <div className="app-shell">
      <header className="shell flex items-center justify-between gap-3 py-4">
        <Link href="/app" className="group" aria-label="Givy home">
          <Logo size="sm" />
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/app/profile"
            className="grid h-8 w-8 place-items-center rounded-full text-xs font-bold text-white"
            style={{ background: `hsl(${user.avatarHue} 55% 42%)` }}
            title="Profile"
          >
            {user.name
              .split(" ")
              .map((p) => p[0])
              .join("")
              .slice(0, 2)}
          </Link>
        </div>
      </header>

      <div className={`shell app-content ${showNav ? "pb-28" : "pb-8"}`}>{children}</div>

      {showNav && <AppNav />}
    </div>
  );
}
