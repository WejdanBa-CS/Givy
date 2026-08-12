"use client";

import { useEffect, useState } from "react";
import { daysUntil } from "@/lib/store";

export function Countdown({ eventDate }: { eventDate: string }) {
  const [days, setDays] = useState(() => daysUntil(eventDate));

  useEffect(() => {
    setDays(daysUntil(eventDate));
    const id = window.setInterval(() => setDays(daysUntil(eventDate)), 60_000);
    return () => window.clearInterval(id);
  }, [eventDate]);

  const label =
    days > 1
      ? `${days} days to go`
      : days === 1
        ? "Tomorrow"
        : days === 0
          ? "Today"
          : `${Math.abs(days)} days ago`;

  return (
    <div className="animate-tick inline-flex items-center gap-2 rounded-full border border-line bg-white/70 px-3 py-1.5 text-sm font-semibold text-ink-soft backdrop-blur">
      <span aria-hidden className="h-2 w-2 rounded-full bg-coral" />
      {label}
    </div>
  );
}
