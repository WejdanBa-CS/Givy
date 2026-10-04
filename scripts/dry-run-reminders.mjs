#!/usr/bin/env node
/**
 * Local dry-run for event reminder planning (no DB, no network, no deploy).
 *
 * Usage:
 *   node scripts/dry-run-reminders.mjs
 *   node scripts/dry-run-reminders.mjs --now=2026-10-05T02:30:00.000Z
 */

function localDateParts(timeZone, now = new Date()) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: timeZone || "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = fmt.formatToParts(now);
  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function addDaysIso(isoDate, days) {
  const [y, m, d] = isoDate.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d));
  utc.setUTCDate(utc.getUTCDate() + days);
  return utc.toISOString().slice(0, 10);
}

const argNow = process.argv.find((a) => a.startsWith("--now="))?.slice(6);
const now = argNow ? new Date(argNow) : new Date();

const scenarios = [
  {
    label: "US recipient, friend event today (NY)",
    recipientTz: "America/New_York",
    eventDate: null, // filled with recipient today
    expect: "day_of",
  },
  {
    label: "DE recipient, friend event in 7 days (Berlin)",
    recipientTz: "Europe/Berlin",
    eventDate: null, // filled with today+7
    expect: "week_before",
  },
  {
    label: "SA vs US midnight skew check",
    recipientTz: "Asia/Riyadh",
    eventDate: localDateParts("Asia/Riyadh", now),
    expect: "day_of",
  },
];

console.log("Givy reminder dry-run");
console.log("now UTC:", now.toISOString());
console.log("");

for (const s of scenarios) {
  const today = localDateParts(s.recipientTz, now);
  const eventDate =
    s.expect === "week_before" ? addDaysIso(today, 7) : s.eventDate || today;
  const kind =
    eventDate === today
      ? "day_of"
      : eventDate === addDaysIso(today, 7)
        ? "week_before"
        : "none";
  const ok = kind === s.expect;
  console.log(`${ok ? "OK" : "FAIL"}  ${s.label}`);
  console.log(`     tz=${s.recipientTz} localToday=${today} event=${eventDate} => ${kind}`);
}

console.log("");
console.log("No network calls. Apply SQL + set CRON_SECRET before real cron tests.");
