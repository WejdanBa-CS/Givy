"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  {
    href: "/app",
    label: "Home",
    match: (p: string) => p === "/app",
    icon: HomeIcon,
  },
  {
    href: "/app/lists",
    label: "Lists",
    match: (p: string) => p.startsWith("/app/lists"),
    icon: ListsIcon,
  },
  {
    href: "/app/create",
    label: "Create",
    match: (p: string) => p.startsWith("/app/create"),
    icon: CreateIcon,
    primary: true,
  },
  {
    href: "/app/giveaways",
    label: "Gives",
    match: (p: string) => p.startsWith("/app/giveaways"),
    icon: GiftIcon,
  },
  {
    href: "/app/profile",
    label: "You",
    match: (p: string) => p.startsWith("/app/profile"),
    icon: ProfileIcon,
  },
] as const;

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="app-nav" aria-label="App">
      <div className="app-nav-inner">
        {tabs.map((tab) => {
          const active = tab.match(pathname);
          const Icon = tab.icon;
          const primary = "primary" in tab && tab.primary;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`app-nav-item ${active ? "is-active" : ""} ${primary ? "is-primary" : ""}`}
            >
              <span className="app-nav-icon">
                <Icon />
              </span>
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function HomeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ListsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CreateIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function GiftIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="10" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 10v10M4 14h16" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 10c-2.5-3.5-6-2.5-6 0 0 1.8 1.8 3 6 3 4.2 0 6-1.2 6-3 0-2.5-3.5-3.5-6 0Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="9" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5 19c1.5-3 4-4.5 7-4.5s5.5 1.5 7 4.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
