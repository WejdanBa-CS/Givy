"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MonthCalendar } from "@/components/MonthCalendar";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  listFriendEvents,
  listMyEvents,
} from "@/lib/api/events";
import { useGivy } from "@/lib/givy-context";
import { formatShortDate } from "@/lib/store";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import type { CalendarEvent } from "@/lib/types";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function CalendarPage() {
  const { lists } = useGivy();
  const configured = isSupabaseConfigured();
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selected, setSelected] = useState(todayIso);
  const [mine, setMine] = useState<CalendarEvent[]>([]);
  const [friends, setFriends] = useState<CalendarEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [listId, setListId] = useState("");
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    if (!configured) return;
    try {
      const [m, f] = await Promise.all([listMyEvents(), listFriendEvents()]);
      setMine(m);
      setFriends(f);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load calendar.");
    }
  }, [configured]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const marks = useMemo(
    () => [
      ...mine.map((e) => ({ date: e.eventDate, kind: "mine" as const })),
      ...friends.map((e) => ({ date: e.eventDate, kind: "friend" as const })),
    ],
    [mine, friends],
  );

  const dayEvents = useMemo(() => {
    const personal = mine
      .filter((e) => e.eventDate === selected)
      .map((e) => ({ ...e, isFriendEvent: false }));
    const theirs = friends
      .filter((e) => e.eventDate === selected)
      .map((e) => ({ ...e, isFriendEvent: true }));
    return [...personal, ...theirs];
  }, [mine, friends, selected]);

  const upcoming = useMemo(() => {
    const start = todayIso();
    return [...mine.map((e) => ({ ...e, isFriendEvent: false })), ...friends]
      .filter((e) => e.eventDate >= start)
      .sort((a, b) => a.eventDate.localeCompare(b.eventDate))
      .slice(0, 8);
  }, [mine, friends]);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!configured) return;
    setSaving(true);
    try {
      await createCalendarEvent({
        name,
        eventDate: selected,
        listId: listId || null,
      });
      setName("");
      setListId("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add event.");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    try {
      await deleteCalendarEvent(id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete event.");
    }
  }

  return (
    <div className="mx-auto max-w-lg animate-rise space-y-5">
      <div>
        <h1 className="font-display text-4xl tracking-tight text-ink">Calendar</h1>
        <p className="mt-1 text-ink-soft">
          Your occasions and friends&apos; upcoming dates — linked to wishlists.
        </p>
      </div>

      {!configured && (
        <p className="panel px-5 py-4 text-sm text-ink-soft">
          Sign in with a live account to sync calendar events. Demo mode stays local-only.
        </p>
      )}

      {error && (
        <p className="rounded-2xl border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-coral-deep">
          {error}
        </p>
      )}

      <MonthCalendar
        month={month}
        selected={selected}
        marks={marks}
        onSelect={setSelected}
        onMonthChange={setMonth}
      />

      <section className="panel space-y-3 p-4 sm:p-5">
        <h2 className="font-display text-2xl text-ink">
          {formatShortDate(selected)}
        </h2>
        <ul className="space-y-2">
          {dayEvents.map((ev) => (
            <li
              key={ev.id}
              className={`rounded-2xl border px-4 py-3 ${
                ev.isFriendEvent
                  ? "border-leaf/35 bg-leaf/10"
                  : "border-[var(--line)] bg-mist/60"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-ink">{ev.name}</p>
                  <p className="text-xs text-ink-soft">
                    {ev.isFriendEvent
                      ? `${ev.ownerName ?? "Friend"} · friend event`
                      : "Your event"}
                  </p>
                  {ev.listId && (
                    <Link
                      href={`/app/${ev.listId}`}
                      className="mt-1 inline-block text-xs font-bold text-coral-deep"
                    >
                      Open wishlist →
                    </Link>
                  )}
                </div>
                {!ev.isFriendEvent && (
                  <button
                    type="button"
                    className="text-xs font-bold text-ink-soft hover:text-coral-deep"
                    onClick={() => void onDelete(ev.id)}
                  >
                    Delete
                  </button>
                )}
              </div>
            </li>
          ))}
          {dayEvents.length === 0 && (
            <li className="text-sm text-ink-soft">Nothing on this day yet.</li>
          )}
        </ul>

        <form onSubmit={(e) => void onAdd(e)} className="space-y-3 border-t border-[var(--line)] pt-4">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-ink-soft">
            Add your event
          </p>
          <input
            className="field w-full"
            placeholder="Event name (e.g. Maya's birthday)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={120}
            disabled={!configured}
          />
          <select
            className="field w-full"
            value={listId}
            onChange={(e) => setListId(e.target.value)}
            disabled={!configured}
          >
            <option value="">No wishlist linked</option>
            {lists.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={!configured || saving || !name.trim()}
          >
            {saving ? "Saving…" : "Add to calendar"}
          </button>
        </form>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-2xl text-ink">Coming up</h2>
        <ul className="panel divide-y divide-[var(--line)] overflow-hidden">
          {upcoming.map((ev) => (
            <li key={ev.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink">{ev.name}</p>
                <p className="text-xs text-ink-soft">
                  {formatShortDate(ev.eventDate)}
                  {ev.isFriendEvent ? ` · ${ev.ownerName ?? "Friend"}` : " · You"}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[0.65rem] font-bold ${
                  ev.isFriendEvent
                    ? "bg-leaf/15 text-leaf"
                    : "bg-coral/15 text-coral-deep"
                }`}
              >
                {ev.isFriendEvent ? "Friend" : "Yours"}
              </span>
            </li>
          ))}
          {upcoming.length === 0 && (
            <li className="px-5 py-6 text-center text-sm text-ink-soft">
              No upcoming events yet.
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
