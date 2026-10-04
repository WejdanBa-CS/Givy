"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { updatePrivacySettings } from "@/lib/api/auth";
import { useGivy } from "@/lib/givy-context";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import type { PrivacyVisibility } from "@/lib/types";

const VIS: { value: PrivacyVisibility; label: string; help: string }[] = [
  { value: "private", label: "Only me", help: "Hidden from friends." },
  {
    value: "friends",
    label: "Friends",
    help: "Accepted friends can see this.",
  },
  {
    value: "public",
    label: "Anyone signed in",
    help: "Broader visibility inside Givy (not the public share link).",
  },
];

const TIMEZONES = [
  "UTC",
  "Asia/Riyadh",
  "Europe/Berlin",
  "Europe/London",
  "America/New_York",
  "America/Los_Angeles",
  "America/Chicago",
];

export default function PrivacySettingsPage() {
  const { user, refresh } = useGivy();
  const configured = isSupabaseConfigured();
  const [username, setUsername] = useState("");
  const [calendarVisibility, setCalendarVisibility] =
    useState<PrivacyVisibility>("friends");
  const [wishlistVisibility, setWishlistVisibility] =
    useState<PrivacyVisibility>("friends");
  const [timezone, setTimezone] = useState("UTC");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setUsername(user.username ?? "");
    setCalendarVisibility(user.calendarVisibility ?? "friends");
    setWishlistVisibility(user.wishlistVisibility ?? "friends");
    if (user.timezone && user.timezone !== "UTC") {
      setTimezone(user.timezone);
      return;
    }
    try {
      setTimezone(
        user.timezone ||
          Intl.DateTimeFormat().resolvedOptions().timeZone ||
          "UTC",
      );
    } catch {
      setTimezone(user.timezone || "UTC");
    }
  }, [user]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!configured) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await updatePrivacySettings({
        username: username.trim() || null,
        calendarVisibility,
        wishlistVisibility,
        timezone,
      });
      await refresh();
      setMessage("Saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-lg animate-rise space-y-5">
      <div>
        <Link href="/app/profile" className="text-sm font-semibold text-coral-deep">
          ← Profile
        </Link>
        <h1 className="mt-2 font-display text-4xl tracking-tight text-ink">
          Privacy
        </h1>
        <p className="mt-1 text-ink-soft">
          Control who sees your calendar and published wishlists. Public share links
          still work separately.
        </p>
      </div>

      {!configured && (
        <p className="panel px-5 py-4 text-sm text-ink-soft">
          Privacy settings need a live signed-in account.
        </p>
      )}

      {message && (
        <p className="rounded-2xl border border-leaf/40 bg-leaf/10 px-4 py-3 text-sm text-leaf">
          {message}
        </p>
      )}
      {error && (
        <p className="rounded-2xl border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-coral-deep">
          {error}
        </p>
      )}

      <form onSubmit={(e) => void onSave(e)} className="panel space-y-5 p-5">
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-ink-soft">
            Username
          </span>
          <input
            className="field mt-1.5 w-full"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="givy_user"
            pattern="[A-Za-z0-9_]{3,32}"
            title="3–32 letters, numbers, or underscore"
            disabled={!configured}
          />
        </label>

        <fieldset className="space-y-2">
          <legend className="text-xs font-bold uppercase tracking-[0.12em] text-ink-soft">
            Calendar visibility
          </legend>
          {VIS.map((v) => (
            <label
              key={`cal-${v.value}`}
              className="flex gap-3 rounded-2xl border border-[var(--line)] px-3 py-2.5"
            >
              <input
                type="radio"
                name="calendar"
                checked={calendarVisibility === v.value}
                onChange={() => setCalendarVisibility(v.value)}
                disabled={!configured}
              />
              <span>
                <span className="block font-semibold text-ink">{v.label}</span>
                <span className="text-xs text-ink-soft">{v.help}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-xs font-bold uppercase tracking-[0.12em] text-ink-soft">
            Wishlist visibility
          </legend>
          {VIS.map((v) => (
            <label
              key={`wish-${v.value}`}
              className="flex gap-3 rounded-2xl border border-[var(--line)] px-3 py-2.5"
            >
              <input
                type="radio"
                name="wishlist"
                checked={wishlistVisibility === v.value}
                onChange={() => setWishlistVisibility(v.value)}
                disabled={!configured}
              />
              <span>
                <span className="block font-semibold text-ink">{v.label}</span>
                <span className="text-xs text-ink-soft">{v.help}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <label className="block">
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-ink-soft">
            Reminder timezone
          </span>
          <select
            className="field mt-1.5 w-full"
            value={TIMEZONES.includes(timezone) ? timezone : "UTC"}
            onChange={(e) => setTimezone(e.target.value)}
            disabled={!configured}
          >
            {!TIMEZONES.includes(timezone) && (
              <option value={timezone}>{timezone}</option>
            )}
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={!configured || saving}
        >
          {saving ? "Saving…" : "Save privacy settings"}
        </button>
      </form>
    </div>
  );
}
