"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGivy } from "@/lib/givy-context";

export default function ProfilePage() {
  const { user, lists, signOut } = useGivy();
  const router = useRouter();

  if (!user) return null;

  return (
    <div className="mx-auto max-w-lg animate-rise space-y-5">
      <section className="panel flex items-center gap-4 p-5">
        <span
          className="grid h-16 w-16 place-items-center rounded-full text-lg font-bold text-white"
          style={{ background: `hsl(${user.avatarHue} 55% 42%)` }}
        >
          {user.name
            .split(" ")
            .map((p) => p[0])
            .join("")
            .slice(0, 2)}
        </span>
        <div>
          <h1 className="font-display text-3xl text-ink">{user.name}</h1>
          <p className="text-sm text-ink-soft">
            {user.provider === "guest"
              ? "Guest · no email · this browser only"
              : `${user.email} · ${user.provider}`}
          </p>
        </div>
      </section>

      <section className="panel divide-y divide-[var(--line)] overflow-hidden">
        <Link
          href="/app/lists"
          className="flex items-center justify-between px-5 py-4"
        >
          <span className="font-semibold">Your lists</span>
          <span className="text-ink-soft">{lists.length}</span>
        </Link>
        <Link
          href="/app/activity"
          className="flex items-center justify-between px-5 py-4"
        >
          <span className="font-semibold">Activity</span>
          <span className="text-ink-soft">→</span>
        </Link>
        <Link
          href="/privacy"
          className="flex items-center justify-between px-5 py-4"
        >
          <span className="font-semibold">Privacy</span>
          <span className="text-ink-soft">→</span>
        </Link>
        <Link
          href="/delete-account"
          className="flex items-center justify-between px-5 py-4"
        >
          <span className="font-semibold">Delete account & data</span>
          <span className="text-ink-soft">→</span>
        </Link>
        <Link
          href="/terms"
          className="flex items-center justify-between px-5 py-4"
        >
          <span className="font-semibold">Terms</span>
          <span className="text-ink-soft">→</span>
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
