"use client";

import Link from "next/link";
import { useGivy } from "@/lib/givy-context";
import { formatShortDate } from "@/lib/store";

export default function ActivityPage() {
  const { activity } = useGivy();

  return (
    <div className="animate-rise space-y-5">
      <div>
        <h1 className="font-display text-4xl font-semibold tracking-tight text-ink">Activity</h1>
        <p className="mt-1 text-sm font-semibold text-ink-soft">
          Claims stay anonymous. You only see that something was taken.
        </p>
      </div>

      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-soft">Recent</p>

      <ul className="panel divide-y divide-[var(--line)] overflow-hidden">
        {activity.map((a) => (
          <li key={a.id} className="px-5 py-4 transition hover:bg-mist-deep/40">
            <p className="font-semibold text-ink">{a.message}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-ink-soft">
              <span>{formatShortDate(a.at)}</span>
              {a.listId && (
                <Link href={`/app/${a.listId}`} className="font-semibold text-coral">
                  View list
                </Link>
              )}
              {a.giveawayId && (
                <Link href="/app/giveaways" className="font-semibold text-coral">
                  View giveaways
                </Link>
              )}
            </div>
          </li>
        ))}
        {activity.length === 0 && (
          <li className="px-5 py-8 text-center text-sm text-ink-soft">
            Nothing yet. Create a Givy to get going.
          </li>
        )}
      </ul>
    </div>
  );
}
