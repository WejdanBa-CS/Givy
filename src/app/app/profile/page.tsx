"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserAvatar } from "@/components/UserAvatar";
import { useGivy } from "@/lib/givy-context";

export default function ProfilePage() {
  const { user, lists, signOut } = useGivy();
  const router = useRouter();

  if (!user) return null;

  return (
    <div className="mx-auto max-w-lg animate-rise space-y-5">
      <section className="panel flex items-center gap-4 p-5">
        <UserAvatar
          name={user.name}
          hue={user.avatarHue}
          src={user.avatarUrl}
          size="lg"
        />
        <div className="min-w-0">
          <p className="text-sm text-ink-soft">Signed in as</p>
          <h1 className="font-display text-3xl font-semibold text-ink">{user.name}</h1>
          <p className="truncate text-sm text-ink-soft">
            {user.provider === "guest"
              ? "Demo account · this browser only"
              : `${user.email} · ${user.provider}`}
          </p>
        </div>
      </section>

      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-soft">Account</p>

      <section className="panel divide-y divide-[var(--line)] overflow-hidden">
        <Link
          href="/app/lists"
          className="flex items-center justify-between px-5 py-4 transition hover:bg-mist-deep/40"
        >
          <span className="font-medium text-ink">Your lists</span>
          <span className="text-sm font-semibold text-ink-soft">{lists.length}</span>
        </Link>
        <Link
          href="/app/activity"
          className="flex items-center justify-between px-5 py-4 transition hover:bg-mist-deep/40"
        >
          <span className="font-medium text-ink">Activity</span>
          <ChevronRight aria-hidden size={18} strokeWidth={1.75} className="text-ink-soft" />
        </Link>
        <Link
          href="/privacy"
          className="flex items-center justify-between px-5 py-4 transition hover:bg-mist-deep/40"
        >
          <span className="font-medium text-ink">Privacy</span>
          <ChevronRight aria-hidden size={18} strokeWidth={1.75} className="text-ink-soft" />
        </Link>
        <Link
          href="/delete-account"
          className="flex items-center justify-between px-5 py-4 transition hover:bg-mist-deep/40"
        >
          <span className="font-medium text-ink">Delete account & data</span>
          <ChevronRight aria-hidden size={18} strokeWidth={1.75} className="text-ink-soft" />
        </Link>
        <Link
          href="/terms"
          className="flex items-center justify-between px-5 py-4 transition hover:bg-mist-deep/40"
        >
          <span className="font-medium text-ink">Terms</span>
          <ChevronRight aria-hidden size={18} strokeWidth={1.75} className="text-ink-soft" />
        </Link>
      </section>

      <button
        type="button"
        className="btn btn-secondary w-full"
        onClick={() => {
          void signOut().then(() => router.replace("/"));
        }}
      >
        Sign out
      </button>
    </div>
  );
}
