"use client";

import { useEffect, useState } from "react";
import { daysUntil } from "@/lib/store";

function partsUntil(eventDate: string) {
  const target = new Date(`${eventDate}T23:59:59`);
  const diff = Math.max(0, target.getTime() - Date.now());
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const mins = Math.floor((diff % 3_600_000) / 60_000);
  return { days, hours, mins };
}

export function Countdown({
  eventDate,
  compact = true,
}: {
  eventDate: string;
  compact?: boolean;
}) {
  const [days, setDays] = useState(() => daysUntil(eventDate));
  const [parts, setParts] = useState(() => partsUntil(eventDate));

  useEffect(() => {
    const tick = () => {
      setDays(daysUntil(eventDate));
      setParts(partsUntil(eventDate));
    };
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [eventDate]);

  if (!compact) {
    const units = [
      { v: parts.days, l: "days" },
      { v: parts.hours, l: "hrs" },
      { v: parts.mins, l: "min" },
    ];
    return (
      <div className="flex items-center gap-3">
        {units.map((u, i) => (
          <div key={u.l} className="flex items-center gap-3">
            <div className="flex flex-col items-center">
              <span className="font-display text-3xl font-black tabular-nums leading-none text-coral">
                {String(u.v).padStart(2, "0")}
              </span>
              <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-ink-soft">
                {u.l}
              </span>
            </div>
            {i < units.length - 1 && (
              <span className="mb-3 text-2xl font-black text-line">:</span>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="countdown-card !flex-row !items-baseline !gap-1 !px-3 !py-2">
      <span className="num !text-xl">{days}</span>
      <span className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">
        {days === 1 ? "day" : "days"}
      </span>
    </div>
  );
}
