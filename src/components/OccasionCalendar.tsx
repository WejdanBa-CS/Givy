"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatShortDate } from "@/lib/store";
import {
  OCCASION_EMOJI,
  OCCASION_LABELS,
  type GivyList,
} from "@/lib/types";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function toDateKey(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function monthLabel(d: Date) {
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

type Props = {
  lists: GivyList[];
  selected: string;
  onSelect: (key: string) => void;
  compact?: boolean;
};

export function OccasionCalendar({
  lists,
  selected,
  onSelect,
  compact = false,
}: Props) {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));

  const byDate = useMemo(() => {
    const map = new Map<string, GivyList[]>();
    for (const list of lists) {
      const key = list.eventDate.slice(0, 10);
      const bucket = map.get(key) ?? [];
      bucket.push(list);
      map.set(key, bucket);
    }
    return map;
  }, [lists]);

  const cells = useMemo(() => {
    const first = startOfMonth(cursor);
    const startPad = first.getDay();
    const daysInMonth = new Date(
      cursor.getFullYear(),
      cursor.getMonth() + 1,
      0,
    ).getDate();
    const total = Math.ceil((startPad + daysInMonth) / 7) * 7;
    const out: Array<{ key: string; day: number | null; inMonth: boolean }> =
      [];
    for (let i = 0; i < total; i++) {
      const dayNum = i - startPad + 1;
      if (dayNum < 1 || dayNum > daysInMonth) {
        out.push({ key: `pad-${i}`, day: null, inMonth: false });
      } else {
        const key = `${cursor.getFullYear()}-${pad(cursor.getMonth() + 1)}-${pad(dayNum)}`;
        out.push({ key, day: dayNum, inMonth: true });
      }
    }
    return out;
  }, [cursor]);

  const todayKey = toDateKey(new Date());

  return (
    <div className={`cal ${compact ? "cal-compact" : ""}`}>
      <div className="cal-toolbar">
        <button
          type="button"
          className="btn btn-secondary !px-3 !py-2"
          aria-label="Previous month"
          onClick={() =>
            setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
          }
        >
          ←
        </button>
        <p className="font-display text-xl text-ink">{monthLabel(cursor)}</p>
        <button
          type="button"
          className="btn btn-secondary !px-3 !py-2"
          aria-label="Next month"
          onClick={() =>
            setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
          }
        >
          →
        </button>
      </div>

      <div className="cal-weekdays">
        {WEEKDAYS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className="cal-grid">
        {cells.map((cell) => {
          if (!cell.inMonth || cell.day == null) {
            return <div key={cell.key} className="cal-cell is-empty" />;
          }
          const events = byDate.get(cell.key) ?? [];
          const isSelected = cell.key === selected;
          const isToday = cell.key === todayKey;
          return (
            <button
              key={cell.key}
              type="button"
              className={`cal-cell ${isSelected ? "is-selected" : ""} ${isToday ? "is-today" : ""} ${events.length ? "has-events" : ""}`}
              onClick={() => onSelect(cell.key)}
            >
              <span className="cal-day">{cell.day}</span>
              {events.length > 0 && (
                <span className="cal-dots" aria-hidden>
                  {events.slice(0, 3).map((e) => (
                    <i key={e.id} />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DayLists({
  lists,
  selected,
}: {
  lists: GivyList[];
  selected: string;
}) {
  const selectedLists = lists.filter((l) => l.eventDate.slice(0, 10) === selected);

  return (
    <section className="space-y-3">
      <h2 className="font-display text-2xl text-ink">
        {formatShortDate(selected)}
      </h2>
      {selectedLists.length === 0 ? (
        <div className="panel p-5 text-sm text-ink-soft">
          No occasions this day.{" "}
          <Link href="/app/create" className="font-semibold text-coral-deep">
            Create a list
          </Link>
        </div>
      ) : (
        selectedLists.map((list) => {
          const open = list.items.filter((i) => !i.purchased).length;
          return (
            <Link
              key={list.id}
              href={`/app/${list.id}`}
              className="panel block p-4"
            >
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-leaf">
                {OCCASION_EMOJI[list.occasion]} {OCCASION_LABELS[list.occasion]}
                {list.published ? " · Live" : " · Draft"}
              </p>
              <p className="mt-1 font-semibold text-ink">{list.title}</p>
              <p className="text-sm text-ink-soft">
                {open} open · {list.items.length} gifts
              </p>
            </Link>
          );
        })
      )}
    </section>
  );
}
