"use client";

import { useEffect, useState } from "react";
import { daysUntil } from "@/lib/store";

export function Countdown({
  eventDate,
  compact = true,
}: {
  eventDate: string;
  compact?: boolean;
}) {
  const [days, setDays] = useState(() => daysUntil(eventDate));

  useEffect(() => {
    setDays(daysUntil(eventDate));
    const id = window.setInterval(() => setDays(daysUntil(eventDate)), 60_000);
    return () => window.clearInterval(id);
  }, [eventDate]);

  if (!compact) {
    return (
      <div className="countdown-card">
        <span className="num">{days}</span>
        <span className="mt-1 text-xs font-bold text-ink-soft">
          {days === 1 ? "day to go" : "days to go"}
        </span>
      </div>
    );
  }

  return (
    <div className="countdown-card !flex-row !py-2 !px-3">
      <span className="num !text-xl">{days}</span>
    </div>
  );
}
