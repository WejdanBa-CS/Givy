"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppNav } from "@/components/AppNav";
import { ClaimNotificationWatcher } from "@/components/ClaimNotificationWatcher";
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
      <header className="shell flex items-center justify-between gap-3 py-4 pt-[max(1.75rem,calc(env(safe-area-inset-top,0px)+1rem))] lg:py-5">
        <Link href="/app" className="group min-w-0" aria-label="Givy home">
          <Logo size="md" />
        </Link>
        <div className="flex shrink-0 items-center gap-2 lg:gap-3">
          <Link
            href="/app/profile"
            className="grid h-8 w-8 place-items-center rounded-full text-xs font-bold text-white lg:h-9 lg:w-9"
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

      <div
        className={`shell app-content ${showNav ? "pb-28 lg:pb-32" : "pb-8 lg:pb-12"}`}
      >
        <div className="mb-4 empty:hidden">
          <ClaimNotificationWatcher />
        </div>
        {children}
      </div>

      {showNav && <AppNav />}
    </div>
  );
}
