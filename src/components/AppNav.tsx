"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/app", label: "Home", match: (path: string) => path === "/app", icon: HomeIcon },
  { href: "/app/lists", label: "Lists", match: (path: string) => { if (path.startsWith("/app/lists")) return true; return !["/app", "/app/create", "/app/activity", "/app/profile", "/app/giveaways"].includes(path) && /^\/app\/[^/]+$/.test(path); }, icon: ListsIcon },
  { href: "/app/create", label: "Create", match: (path: string) => path.startsWith("/app/create"), icon: CreateIcon, primary: true },
  { href: "/app/activity", label: "Activity", match: (path: string) => path.startsWith("/app/activity"), icon: ActivityIcon },
  { href: "/app/profile", label: "You", match: (path: string) => path.startsWith("/app/profile"), icon: ProfileIcon },
] as const;

export function AppNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-line bg-mist/96 px-3.5 pb-[calc(.65rem+env(safe-area-inset-bottom))] pt-2.5 backdrop-blur-[14px] lg:left-1/2 lg:right-auto lg:bottom-[1.35rem] lg:w-[min(640px,calc(100%-3rem))] lg:-translate-x-1/2 lg:rounded-[1.35rem] lg:border-2 lg:px-3.5 lg:py-3 lg:shadow-givy" aria-label="Main">
      <div className="mx-auto grid w-full max-w-[560px] grid-cols-5 items-end gap-0.5 lg:max-w-none lg:gap-1.5">
        {tabs.map((tab) => {
          const active = tab.match(pathname);
          const primary = "primary" in tab && tab.primary;
          const Icon = tab.icon;
          const iconClass = primary
            ? `grid h-11 w-11 place-items-center rounded-full text-white transition ${active ? "bg-coral-deep" : "bg-coral hover:bg-coral-deep"} -mt-[1.1rem] lg:-mt-3`
            : "grid h-7 w-7 place-items-center";
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-w-0 flex-col items-center gap-0.5 rounded-2xl px-0.5 py-1.5 text-[clamp(.58rem,2.6vw,.68rem)] font-bold tracking-[.01em] transition hover:text-ink lg:px-1 lg:py-1.5 lg:text-xs ${active ? "text-ink" : "text-ink-soft"}`}
            >
              <span className={iconClass}><Icon /></span>
              <span className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function HomeIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>; }
function ListsIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>; }
function CreateIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>; }
function ActivityIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M4 12h4l2-6 4 12 2-6h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function ProfileIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden><circle cx="12" cy="9" r="3.5" stroke="currentColor" strokeWidth="1.8" /><path d="M5 19c1.5-3 4-4.5 7-4.5s5.5 1.5 7 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>; }
