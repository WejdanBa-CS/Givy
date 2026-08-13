"use client";

import Link from "next/link";
import { Countdown } from "@/components/Countdown";
import { useGivy } from "@/lib/givy-context";
import { formatMoney, formatShortDate } from "@/lib/store";
import { OCCASION_EMOJI, OCCASION_LABELS } from "@/lib/types";

export default function AppHomePage() {
  const { user, lists, activity, cloud } = useGivy();
  const today = new Date().toISOString().slice(0, 10);
  const upcoming =
    [...lists]
      .filter((l) => l.eventDate >= today)
      .sort((a, b) => a.eventDate.localeCompare(b.eventDate))[0] ??
    [...lists].sort((a, b) => b.eventDate.localeCompare(a.eventDate))[0];
  const claimedTotal = lists.reduce(
    (n, l) => n + l.items.filter((i) => i.purchased).length,
    0,
  );
  const openTotal = lists.reduce(
    (n, l) => n + l.items.filter((i) => !i.purchased).length,
    0,
  );

  return (
    <div className="animate-rise space-y-6">
      <section>
        <p className="text-sm font-semibold text-ink-soft">Welcome back</p>
        <h1 className="font-display text-4xl tracking-tight text-ink">
          {user?.name.split(" ")[0]}, ready to Givy?
        </h1>
        {!cloud && (
          <p className="mt-2 text-sm text-ink-soft">
            Local demo: lists live in this browser. Connect Supabase for cloud sync.
          </p>
        )}
      </section>

      <section className="grid grid-cols-3 gap-3">
        {[
          { label: "Lists", value: String(lists.length) },
          { label: "Open gifts", value: String(openTotal) },
          { label: "Claimed", value: String(claimedTotal) },
        ].map((stat) => (
          <div key={stat.label} className="panel px-3 py-4 text-center">
            <p className="font-display text-2xl text-ink">{stat.value}</p>
            <p className="text-xs font-semibold text-ink-soft">{stat.label}</p>
          </div>
        ))}
      </section>

      {upcoming && (
        <section className="panel overflow-hidden p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-leaf">
                Next up · {OCCASION_EMOJI[upcoming.occasion]}{" "}
                {OCCASION_LABELS[upcoming.occasion]}
              </p>
              <h2 className="mt-1 font-display text-2xl text-ink">
                {upcoming.title}
              </h2>
              <p className="mt-1 text-sm text-ink-soft">
                {upcoming.items.filter((i) => !i.purchased).length} still open ·{" "}
                {formatShortDate(upcoming.eventDate)}
              </p>
            </div>
            <Countdown eventDate={upcoming.eventDate} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={`/app/${upcoming.id}`} className="btn btn-primary">
              Open list
            </Link>
            {upcoming.published && (
              <Link
                href={`/g/${upcoming.shareCode}`}
                className="btn btn-secondary"
              >
                Shared view
              </Link>
            )}
          </div>
        </section>
      )}

      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="font-display text-2xl text-ink">Your lists</h2>
          <Link
            href="/app/lists"
            className="text-sm font-semibold text-coral-deep"
          >
            See all
          </Link>
        </div>
        <div className="stagger space-y-3">
          {lists.slice(0, 3).map((list) => {
            const open = list.items.filter((i) => !i.purchased).length;
            const prices = list.items
              .map((i) => i.price)
              .filter((p): p is number => p != null);
            return (
              <Link
                key={list.id}
                href={`/app/${list.id}`}
                className="panel block p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-leaf">
                      {OCCASION_EMOJI[list.occasion]}{" "}
                      {OCCASION_LABELS[list.occasion]}
                      {list.published ? " · Live" : " · Draft"}
                    </p>
                    <p className="font-semibold text-ink">{list.title}</p>
                    <p className="text-sm text-ink-soft">
                      {open} open
                      {prices.length
                        ? ` · from ${formatMoney(Math.min(...prices))}`
                        : ""}
                    </p>
                  </div>
                  <Countdown eventDate={list.eventDate} />
                </div>
              </Link>
            );
          })}
          {lists.length === 0 && (
            <div className="panel p-6 text-center">
              <p className="font-display text-xl">No lists yet</p>
              <Link href="/app/create" className="btn btn-primary mt-4">
                Create a Givy
              </Link>
            </div>
          )}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="font-display text-2xl text-ink">Activity</h2>
          <Link
            href="/app/activity"
            className="text-sm font-semibold text-coral-deep"
          >
            All
          </Link>
        </div>
        <ul className="panel divide-y divide-[var(--line)] overflow-hidden">
          {activity.slice(0, 4).map((a) => (
            <li key={a.id} className="px-4 py-3 text-sm">
              <p className="font-semibold text-ink">{a.message}</p>
              <p className="text-xs text-ink-soft">{formatShortDate(a.at)}</p>
            </li>
          ))}
          {activity.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-ink-soft">
              No activity yet. Create a list to get started.
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
