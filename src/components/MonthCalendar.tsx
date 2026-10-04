"use client";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Mark = {
  date: string; // YYYY-MM-DD
  kind: "mine" | "friend";
};

type Props = {
  month: Date;
  selected: string;
  marks: Mark[];
  onSelect: (isoDate: string) => void;
  onMonthChange: (month: Date) => void;
};

function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function MonthCalendar({
  month,
  selected,
  marks,
  onSelect,
  onMonthChange,
}: Props) {
  const year = month.getFullYear();
  const m = month.getMonth();
  const first = new Date(year, m, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(year, m + 1, 0).getDate();
  const today = toIso(new Date());

  const markMap = new Map<string, { mine: boolean; friend: boolean }>();
  for (const mark of marks) {
    const cur = markMap.get(mark.date) ?? { mine: false, friend: false };
    if (mark.kind === "mine") cur.mine = true;
    else cur.friend = true;
    markMap.set(mark.date, cur);
  }

  const cells: Array<number | null> = [
    ...Array.from({ length: startPad }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const label = month.toLocaleString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="panel p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          type="button"
          className="btn btn-secondary px-3 py-2 text-sm"
          onClick={() => onMonthChange(new Date(year, m - 1, 1))}
          aria-label="Previous month"
        >
          ←
        </button>
        <h2 className="font-display text-xl text-ink sm:text-2xl">{label}</h2>
        <button
          type="button"
          className="btn btn-secondary px-3 py-2 text-sm"
          onClick={() => onMonthChange(new Date(year, m + 1, 1))}
          aria-label="Next month"
        >
          →
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[0.65rem] font-bold uppercase tracking-wide text-ink-soft">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (day == null) return <div key={`e-${idx}`} />;
          const iso = toIso(new Date(year, m, day));
          const marksFor = markMap.get(iso);
          const isSelected = iso === selected;
          const isToday = iso === today;
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onSelect(iso)}
              className={`relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm font-semibold transition ${
                isSelected
                  ? "bg-coral text-white"
                  : isToday
                    ? "bg-leaf/15 text-ink"
                    : "text-ink hover:bg-mist"
              }`}
            >
              {day}
              {(marksFor?.mine || marksFor?.friend) && (
                <span className="absolute bottom-1 flex gap-0.5">
                  {marksFor.mine && (
                    <span
                      className={`h-1 w-1 rounded-full ${isSelected ? "bg-white" : "bg-coral"}`}
                    />
                  )}
                  {marksFor.friend && (
                    <span
                      className={`h-1 w-1 rounded-full ${isSelected ? "bg-white/80" : "bg-leaf"}`}
                    />
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-ink-soft">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-coral" /> Your events
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-leaf" /> Friends
        </span>
      </div>
    </div>
  );
}
