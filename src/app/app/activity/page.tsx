"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  fetchEventNotifications,
  markEventNotificationsRead,
  type EventNotification,
} from "@/lib/api/event-notifications";
import { useGivy } from "@/lib/givy-context";
import { formatShortDate } from "@/lib/store";

export default function ActivityPage() {
  const { activity } = useGivy();
  const [eventNotes, setEventNotes] = useState<EventNotification[]>([]);

  useEffect(() => {
    void fetchEventNotifications()
      .then((rows) => {
        setEventNotes(rows);
        const unread = rows.filter((r) => !r.read).map((r) => r.id);
        if (unread.length) void markEventNotificationsRead(unread);
      })
      .catch(() => setEventNotes([]));
  }, []);

  return (
    <div className="animate-rise space-y-5">
      <div>
        <h1 className="font-display text-4xl tracking-tight text-ink">Activity</h1>
        <p className="mt-1 text-ink-soft">
          Claims stay anonymous. Friend-occasion reminders show up here too.
        </p>
      </div>

      {eventNotes.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-display text-2xl text-ink">Reminders</h2>
          <ul className="panel divide-y divide-[var(--line)] overflow-hidden">
            {eventNotes.map((n) => (
              <li key={n.id} className="px-5 py-4">
                <p className="font-semibold text-ink">{n.title}</p>
                <p className="mt-0.5 text-sm text-ink-soft">{n.body}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-soft">
                  <span>{formatShortDate(n.at)}</span>
                  {n.kind === "week_before" ? (
                    <span className="font-bold text-leaf">In 7 days</span>
                  ) : (
                    <span className="font-bold text-coral-deep">Today</span>
                  )}
                  {n.listId && (
                    <Link
                      href={`/app/${n.listId}`}
                      className="font-semibold text-coral-deep"
                    >
                      Open wishlist
                    </Link>
                  )}
                  <Link href="/app/calendar" className="font-semibold text-coral-deep">
                    Calendar
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

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
        {activity.length === 0 && eventNotes.length === 0 && (
          <li className="px-5 py-8 text-center text-sm text-ink-soft">
            Nothing yet. Create a Givy to get going.
          </li>
        )}
      </ul>
    </div>
  );
}
