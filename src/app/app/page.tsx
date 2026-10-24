"use client";

import Link from "next/link";
import { Countdown } from "@/components/Countdown";
import { OccasionBadge } from "@/components/OccasionBadge";
import { Plus } from "lucide-react";
import { FadeIn } from "@/components/motion";
import { useGivy } from "@/lib/givy-context";
import { formatMoney, formatShortDate } from "@/lib/store";

export default function AppHomePage() {
  const { user, lists, activity } = useGivy();
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
  const firstName = user?.name.split(" ")[0] ?? "there";
  const otherLists = lists.filter((l) => l.id !== upcoming?.id);

  return (
    <div className="space-y-6 lg:space-y-8">
      <FadeIn>
        <section className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-ink-soft">Good to see you,</p>
            <h1 className="truncate font-display text-[2rem] font-semibold leading-tight tracking-[-0.025em] text-ink sm:text-4xl lg:text-5xl">
              {firstName}
            </h1>
          </div>
          <Link href="/app/create" className="btn btn-primary !min-h-10 shrink-0 !px-4 text-sm">
            <Plus aria-hidden size={16} strokeWidth={2.25} />
            New list
          </Link>
        </section>
      </FadeIn>

      <FadeIn delay={0.06}>
        <dl className="panel grid grid-cols-3 divide-x divide-[var(--line)] py-4">
          {[
            { label: "Lists", value: lists.length },
            { label: "Open gifts", value: openTotal },
            { label: "Claimed", value: claimedTotal },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-1">
              <dd className="font-display text-2xl font-medium tabular-nums leading-none text-ink lg:text-3xl">
                {stat.value}
              </dd>
              <dt className="text-xs text-ink-soft">{stat.label}</dt>
            </div>
          ))}
        </dl>
      </FadeIn>

      {upcoming && (
        <FadeIn delay={0.12}>
          <section className="panel overflow-hidden">
            <div className="flex items-start justify-between gap-4 p-5 lg:p-6">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-soft">
                  Next up
                </p>
                <h2 className="mt-2 font-display text-[1.5rem] font-semibold leading-tight tracking-[-0.02em] text-ink sm:text-2xl lg:text-3xl">
                  {upcoming.title}
                </h2>
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <OccasionBadge
                    occasion={upcoming.occasion}
                    suffix={upcoming.published ? "Shared" : "Draft"}
                  />
                  <span className="text-xs text-ink-soft">
                    {upcoming.items.filter((i) => !i.purchased).length} open ·{" "}
                    {formatShortDate(upcoming.eventDate)}
                  </span>
                </div>
              </div>
              <Countdown eventDate={upcoming.eventDate} />
            </div>
            <div
              className={`grid gap-2 border-t border-line/80 bg-mist/50 p-3 ${upcoming.published ? "grid-cols-2" : "grid-cols-1"}`}
            >
              <Link href={`/app/${upcoming.id}`} className="btn btn-primary !min-h-10 text-sm">
                Open list
              </Link>
              {upcoming.published && (
                <Link href={`/g/${upcoming.shareCode}`} className="btn btn-secondary !min-h-10 text-sm">
                  Friend view
                </Link>
              )}
            </div>
          </section>
        </FadeIn>
      )}

      <div className="space-y-6 lg:grid lg:grid-cols-2 lg:items-start lg:gap-8 lg:space-y-0">
        <section>
          <div className="mb-3 flex items-end justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-soft">
              {upcoming ? "More lists" : "Your lists"}
            </p>
            <Link href="/app/lists" className="text-sm font-semibold text-coral">
              See all
            </Link>
          </div>
          <div className="stagger space-y-3">
            {otherLists.slice(0, 3).map((list) => {
              const claimed = list.items.filter((i) => i.purchased).length;
              const total = list.items.length;
              const pct = total > 0 ? Math.round((claimed / total) * 100) : 0;
              const prices = list.items
                .map((i) => i.price)
                .filter((p): p is number => p != null);
              return (
                <Link
                  key={list.id}
                  href={`/app/${list.id}`}
                  className="panel block p-4 transition-shadow duration-300 hover:shadow-[var(--shadow-raised)] lg:p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <OccasionBadge
                        occasion={list.occasion}
                        suffix={list.published ? "Live" : "Draft"}
                      />
                      <p className="mt-2.5 truncate font-display text-lg font-semibold tracking-[-0.015em] text-ink">
                        {list.title}
                      </p>
                      <p className="mt-0.5 text-sm text-ink-soft">
                        {total - claimed} open
                        {prices.length ? ` · from ${formatMoney(Math.min(...prices))}` : ""}
                      </p>
                    </div>
                    <Countdown eventDate={list.eventDate} />
                  </div>
                  {total > 0 && (
                    <div className="mt-3">
                      <div className="mb-1.5 flex justify-between text-xs text-ink-soft">
                        <span>
                          {claimed} of {total} claimed
                        </span>
                        <span className="tabular-nums">{pct}%</span>
                      </div>
                      <div className="h-1 overflow-hidden rounded-full bg-mist-deep">
                        <div
                          className="h-full rounded-full bg-leaf"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </Link>
              );
            })}
            {lists.length === 0 && (
              <div className="panel p-6 text-center lg:p-8">
                <p className="font-display text-xl font-semibold">No lists yet</p>
                <Link href="/app/create" className="btn btn-primary mt-4">
                  Create a Givy
                </Link>
              </div>
            )}
            {lists.length > 0 && (
              <Link
                href="/app/create"
                className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-dashed border-line text-sm font-medium text-ink-soft transition hover:border-ink/25 hover:text-ink"
              >
                <Plus aria-hidden size={15} strokeWidth={2} />
                New list
              </Link>
            )}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-end justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-soft">
              Activity
            </p>
            <Link href="/app/activity" className="text-sm font-semibold text-coral">
              All
            </Link>
          </div>
          <ul className="panel divide-y divide-[var(--line)] overflow-hidden">
            {activity.slice(0, 4).map((a) => (
              <li key={a.id} className="px-4 py-3 text-sm lg:px-5 lg:py-3.5">
                <p className="font-medium text-ink">{a.message}</p>
                <p className="mt-0.5 text-xs text-ink-soft">
                  {formatShortDate(a.at)}
                </p>
              </li>
            ))}
            {activity.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-ink-soft lg:py-8">
                No activity yet. Create a list to get started.
              </li>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
