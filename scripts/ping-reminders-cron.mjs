#!/usr/bin/env node
/**
 * Local ping for the event-reminders cron route (no deploy).
 *
 *   CRON_SECRET=... node scripts/ping-reminders-cron.mjs
 *   CRON_SECRET=... node scripts/ping-reminders-cron.mjs --url=http://localhost:3000
 */

const argUrl = process.argv.find((a) => a.startsWith("--url="))?.slice(6);
const base = (argUrl || process.env.GIVY_APP_URL || "http://localhost:3000").replace(
  /\/$/,
  "",
);
const secret = process.env.CRON_SECRET?.trim();

if (!secret) {
  console.error("Set CRON_SECRET in the environment first.");
  process.exit(1);
}

const url = `${base}/api/cron/event-reminders`;
console.log("POST", url);

const res = await fetch(url, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${secret}`,
    "Content-Type": "application/json",
  },
});

const text = await res.text();
console.log("status", res.status);
console.log(text);

if (!res.ok) process.exit(1);
