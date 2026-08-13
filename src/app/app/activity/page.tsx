"use client";

import Link from "next/link";
import { useGivy } from "@/lib/givy-context";
import { formatShortDate } from "@/lib/store";

export default function ActivityPage() {
  const { activity } = useGivy();

  return (
    <div className="animate-rise space-y-5">
      <div>
        <h1 className="font-display text-4xl tracking-tight text-ink">Activity</h1>
        <p className="mt-1 text-ink-soft">Claims stay anonymous. You only see that something was taken.</p>
      </div>

      <ul className="panel divide-y divide-[var(--line)] overflow-hidden">
        {activity.map((a) => (
          <li key={a.id} className="px-5 py-4">
            <p className="font-semibold text-ink">{a.message}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-soft">
              <span>{formatShortDate(a.at)}</span>
              {a.listId && (
                <Link href={`/app/${a.listId}`} className="font-semibold text-coral-deep">
                  View list
                </Link>
              )}
              {a.giveawayId && (
                <Link href="/app/giveaways" className="font-semibold text-coral-deep">
                  View giveaways
                </Link>
              )}
            </div>
          </li>
        ))}
        {activity.length === 0 && (
          <li className="px-5 py-8 text-center text-sm text-ink-soft">Nothing yet. Create a Givito to get going.</li>
        )}
      </ul>
    </div>
  );
}
