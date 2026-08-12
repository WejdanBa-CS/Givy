"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGivy } from "@/lib/givy-context";

export default function ProfilePage() {
  const { user, lists, giveaways, signOut } = useGivy();
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
            {user.email} · signed in with {user.provider}
          </p>
        </div>
      </section>

      <section className="panel divide-y divide-[var(--line)] overflow-hidden">
        <Link href="/app/lists" className="flex items-center justify-between px-5 py-4">
          <span className="font-semibold">Your lists</span>
          <span className="text-ink-soft">{lists.length}</span>
        </Link>
        <Link href="/app/giveaways" className="flex items-center justify-between px-5 py-4">
          <span className="font-semibold">Your giveaways</span>
          <span className="text-ink-soft">
            {giveaways.filter((g) => g.ownerId === user.id).length}
          </span>
        </Link>
        <Link href="/app/activity" className="flex items-center justify-between px-5 py-4">
          <span className="font-semibold">Activity</span>
          <span className="text-ink-soft">→</span>
        </Link>
      </section>

      <section className="panel p-5">
        <p className="font-display text-xl text-ink">Coming later</p>
        <ul className="mt-2 space-y-1 text-sm text-ink-soft">
          <li>Retail partnerships & checkout</li>
          <li>Wedding registry upgrades</li>
          <li>Giveaways in cloud beta</li>
        </ul>
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
