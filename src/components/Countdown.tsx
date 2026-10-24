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
      <div className="flex items-start">
        {units.map((u, i) => (
          <div key={u.l} className="flex items-start">
            <div className="flex min-w-[3.25rem] flex-col items-start">
              <span className="font-display text-[2.5rem] font-medium tabular-nums leading-none tracking-[-0.03em] text-coral">
                {String(u.v).padStart(2, "0")}
              </span>
              <span className="mt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-soft">
                {u.l}
              </span>
            </div>
            {i < units.length - 1 && (
              <span className="mx-3 mt-2 h-7 w-px bg-line" aria-hidden />
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex shrink-0 flex-col items-end text-right">
      <span className="font-display text-[1.75rem] font-medium tabular-nums leading-none tracking-[-0.03em] text-coral">
        {days}
      </span>
      <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-soft">
        {days === 1 ? "day to go" : "days to go"}
      </span>
    </div>
  );
}
