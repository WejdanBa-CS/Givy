"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppNav } from "@/components/AppNav";
import { ClaimNotificationWatcher } from "@/components/ClaimNotificationWatcher";
import { Logo } from "@/components/Logo";
import { useGivy } from "@/lib/givy-context";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { ready, user } = useGivy();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  if (!ready || !user) {
    return (
      <div className="shell space-y-6 pb-28 pt-10 lg:pb-32" aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading your Givy workspace…</span>
        <div className="flex items-center justify-between"><div className="h-8 w-28 animate-pulse rounded-lg bg-mist-deep" /><div className="h-9 w-9 animate-pulse rounded-full bg-mist-deep" /></div>
        <div className="space-y-3"><div className="h-4 w-24 animate-pulse rounded bg-mist-deep" /><div className="h-9 w-3/5 animate-pulse rounded bg-mist-deep" /><div className="h-4 w-2/5 animate-pulse rounded bg-mist-deep" /></div>
        <div className="grid gap-4 sm:grid-cols-2">{[0, 1, 2, 3].map((item) => <div key={item} className="panel space-y-4 p-5"><div className="h-5 w-2/3 animate-pulse rounded bg-mist-deep" /><div className="h-4 w-full animate-pulse rounded bg-mist-deep" /><div className="h-4 w-4/5 animate-pulse rounded bg-mist-deep" /></div>)}</div>
      </div>
    );
  }

  const showNav = pathname === "/app" || pathname.startsWith("/app/lists") || pathname.startsWith("/app/create") || pathname.startsWith("/app/profile") || pathname.startsWith("/app/activity") || pathname.startsWith("/app/giveaways") || /^\/app\/[^/]+$/.test(pathname);

  return (
    <div className="app-shell">
      <header className="shell flex items-center justify-between gap-3 py-4 pt-[max(1.75rem,calc(env(safe-area-inset-top,0px)+1rem))] lg:py-5">
        <Link href="/app" className="group min-w-0" aria-label="Givy home"><Logo size="md" /></Link>
        <div className="flex shrink-0 items-center gap-2 lg:gap-3"><Link href="/app/profile" className="grid h-8 w-8 place-items-center rounded-full text-xs font-bold text-white lg:h-9 lg:w-9" style={{ background: `hsl(${user.avatarHue} 55% 42%)` }} title="Profile">{user.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</Link></div>
      </header>
      <div className={`shell app-content ${showNav ? "pb-28 lg:pb-32" : "pb-8 lg:pb-12"}`}><div className="mb-4 empty:hidden"><ClaimNotificationWatcher /></div>{children}</div>
      {showNav && <AppNav />}
    </div>
  );
}
