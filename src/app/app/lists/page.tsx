"use client";

import Link from "next/link";
import { Countdown } from "@/components/Countdown";
import { useGivy } from "@/lib/givy-context";
import { formatMoney } from "@/lib/store";
import { OCCASION_EMOJI, OCCASION_LABELS, type Occasion } from "@/lib/types";
import { useMemo, useState } from "react";

const filters: Array<"all" | Occasion> = [
  "all",
  "birthday",
  "holiday",
  "wedding",
  "baby",
  "graduation",
  "creator",
  "other",
];

export default function ListsPage() {
  const { lists } = useGivy();
  const [filter, setFilter] = useState<(typeof filters)[number]>("all");

  const filtered = useMemo(
    () => (filter === "all" ? lists : lists.filter((l) => l.occasion === filter)),
    [lists, filter],
  );

  return (
    <div className="animate-rise space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl tracking-tight text-ink">Lists</h1>
          <p className="mt-1 text-ink-soft">Birthdays, holidays, weddings: all your Givies.</p>
        </div>
        <Link href="/app/create" className="btn btn-primary">
          New Givy
        </Link>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold ${
              filter === f
                ? "bg-ink text-white"
                : "border border-line bg-white/70 text-ink-soft"
            }`}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "All" : `${OCCASION_EMOJI[f]} ${OCCASION_LABELS[f]}`}
          </button>
        ))}
      </div>

      <div className="stagger space-y-3">
        {filtered.map((list) => {
          const claimed = list.items.filter((i) => i.purchased).length;
          return (
            <Link key={list.id} href={`/app/${list.id}`} className="panel block p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-leaf">
                    {OCCASION_EMOJI[list.occasion]} {OCCASION_LABELS[list.occasion]}
                    {list.published ? " · Shared" : " · Draft"}
                  </p>
                  <h2 className="mt-1 font-display text-2xl text-ink">{list.title}</h2>
                  <p className="mt-1 text-sm text-ink-soft">
                    {list.items.length} items · {claimed} claimed
                    {list.items[0]?.price != null
                      ? ` · from ${formatMoney(
                          Math.min(...list.items.map((i) => i.price ?? Infinity)),
                        )}`
                      : ""}
                  </p>
                </div>
                <Countdown eventDate={list.eventDate} />
              </div>
            </Link>
          );
        })}
        {filtered.length === 0 && (
          <div className="panel p-8 text-center">
            <p className="font-display text-2xl">
              {lists.length === 0 ? "Nothing here yet" : "No lists in this filter"}
            </p>
            <p className="mt-2 text-sm text-ink-soft">
              {lists.length === 0
                ? "Create your first gift list to get started."
                : "Try another occasion, or create a new list."}
            </p>
            <Link href="/app/create" className="btn btn-primary mt-4">
              {lists.length === 0 ? "Create a Givy" : "New Givy"}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
