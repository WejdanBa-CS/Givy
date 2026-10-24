"use client";

import Link from "next/link";
import { Countdown } from "@/components/Countdown";
import { OccasionBadge } from "@/components/OccasionBadge";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";
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

  return (
    <div className="space-y-6 lg:space-y-8">
      <FadeIn>
        <section className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-ink-soft">Good to see you,</p>
            <h1 className="font-display text-3xl font-black tracking-tight text-ink sm:text-4xl lg:text-5xl">
              {firstName}
            </h1>
          </div>
          <Link href="/app/create" className="btn btn-primary shrink-0">
            + New Givy
          </Link>
        </section>
      </FadeIn>

      <Stagger className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
        {[
          { label: "Active lists", value: String(lists.length) },
          { label: "Open gifts", value: String(openTotal) },
          { label: "Claimed", value: String(claimedTotal) },
        ].map((stat) => (
          <StaggerItem key={stat.label}>
            <div className="panel px-3 py-3 sm:px-4 sm:py-4 lg:px-5 lg:py-5">
              <p className="font-display text-xl font-black text-ink sm:text-2xl lg:text-3xl">
                {stat.value}
              </p>
              <p className="mt-1 text-[0.7rem] font-semibold text-ink-soft sm:text-xs lg:text-sm">
                {stat.label}
              </p>
            </div>
          </StaggerItem>
        ))}
      </Stagger>

      {upcoming && (
        <FadeIn delay={0.15}>
          <section className="panel overflow-hidden p-4 sm:p-5 lg:p-6">
            <div className="flex items-start justify-between gap-3 lg:gap-6">
              <div className="min-w-0 flex-1">
                <OccasionBadge
                  occasion={upcoming.occasion}
                  suffix={upcoming.published ? "Shared" : "Draft"}
                />
                <h2 className="mt-3 font-display text-xl font-black text-ink sm:text-2xl lg:text-3xl">
                  {upcoming.title}
                </h2>
                <p className="mt-1 text-sm text-ink-soft lg:text-base">
                  {upcoming.items.filter((i) => !i.purchased).length} still open ·{" "}
                  {formatShortDate(upcoming.eventDate)}
                </p>
              </div>
              <Countdown eventDate={upcoming.eventDate} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2 lg:mt-5">
              <Link href={`/app/${upcoming.id}`} className="btn btn-primary">
                Open list
              </Link>
              {upcoming.published && (
                <Link href={`/g/${upcoming.shareCode}`} className="btn btn-secondary">
                  Shared view
                </Link>
              )}
            </div>
          </section>
        </FadeIn>
      )}

      <div className="space-y-6 lg:grid lg:grid-cols-2 lg:items-start lg:gap-8 lg:space-y-0">
        <section>
          <div className="mb-3 flex items-end justify-between">
            <p className="text-xs font-black uppercase tracking-widest text-ink-soft">
              Your lists
            </p>
            <Link href="/app/lists" className="text-sm font-bold text-coral">
              See all
            </Link>
          </div>
          <div className="stagger space-y-3">
            {lists.slice(0, 3).map((list) => {
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
                  className="panel block p-4 transition-all hover:border-coral/50 hover:shadow-md lg:p-5"
                >
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <OccasionBadge
                      occasion={list.occasion}
                      suffix={list.published ? "Live" : "Draft"}
                    />
                    <Countdown eventDate={list.eventDate} />
                  </div>
                  <p className="truncate font-display text-lg font-black text-ink">
                    {list.title}
                  </p>
                  <p className="mt-1 text-sm text-ink-soft">
                    {total - claimed} open
                    {prices.length ? ` · from ${formatMoney(Math.min(...prices))}` : ""}
                  </p>
                  {total > 0 && (
                    <div className="mt-3">
                      <div className="mb-1 flex justify-between text-xs font-semibold text-ink-soft">
                        <span>
                          {claimed} of {total} claimed
                        </span>
                        <span className="text-leaf">{pct}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-mist-deep">
                        <div
                          className="h-full rounded-full bg-coral"
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
                <p className="font-display text-xl font-black">No lists yet</p>
                <Link href="/app/create" className="btn btn-primary mt-4">
                  Create a Givy
                </Link>
              </div>
            )}
            {lists.length > 0 && (
              <Link
                href="/app/create"
                className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line py-6 text-sm font-bold text-ink-soft transition hover:bg-mist-deep"
              >
                + Create a new Givy
              </Link>
            )}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-end justify-between">
            <p className="text-xs font-black uppercase tracking-widest text-ink-soft">
              Activity
            </p>
            <Link href="/app/activity" className="text-sm font-bold text-coral">
              All
            </Link>
          </div>
          <ul className="panel divide-y divide-[var(--line)] overflow-hidden">
            {activity.slice(0, 4).map((a) => (
              <li key={a.id} className="px-4 py-3 text-sm lg:px-5 lg:py-3.5">
                <p className="font-bold text-ink">{a.message}</p>
                <p className="text-xs font-semibold text-ink-soft">
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
