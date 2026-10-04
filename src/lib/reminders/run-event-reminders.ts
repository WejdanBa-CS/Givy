import type { SupabaseClient } from "@supabase/supabase-js";
import { planEventReminders, type ReminderKind } from "@/lib/reminders/plan";
import { sendFcmPush } from "@/lib/reminders/push";

export type { ReminderKind };

export type ReminderRunResult = {
  scannedRecipients: number;
  created: number;
  skipped: number;
  pushSent: number;
  errors: string[];
};

export function reminderCopy(
  kind: ReminderKind,
  ownerName: string,
  eventName: string,
): { title: string; body: string } {
  if (kind === "week_before") {
    return {
      title: `${ownerName}'s occasion is in 7 days`,
      body: `${eventName} — pick a gift from their wishlist while there's time.`,
    };
  }
  return {
    title: `Today: ${ownerName}'s ${eventName}`,
    body: `It's today — check their Givy list if you still need a gift.`,
  };
}

/**
 * Daily job: for each user, notify about accepted friends' visible events
 * happening today (day_of) or in 7 days (week_before), in the recipient's TZ.
 */
export async function runEventReminders(
  admin: SupabaseClient,
  now = new Date(),
): Promise<ReminderRunResult> {
  const result: ReminderRunResult = {
    scannedRecipients: 0,
    created: 0,
    skipped: 0,
    pushSent: 0,
    errors: [],
  };

  const { data: friendships, error: fErr } = await admin
    .from("friendships")
    .select("requester_id, addressee_id")
    .eq("status", "accepted");
  if (fErr) {
    result.errors.push(fErr.message);
    return result;
  }

  const rows = friendships ?? [];
  const userIds = new Set<string>();
  for (const row of rows) {
    userIds.add(row.requester_id as string);
    userIds.add(row.addressee_id as string);
  }
  result.scannedRecipients = userIds.size;
  if (userIds.size === 0) return result;

  const { data: profiles, error: pErr } = await admin
    .from("profiles")
    .select("id, display_name, timezone, calendar_visibility")
    .in("id", [...userIds]);
  if (pErr) {
    result.errors.push(pErr.message);
    return result;
  }

  const { data: events, error: eErr } = await admin
    .from("calendar_events")
    .select("id, user_id, name, event_date, list_id")
    .in("user_id", [...userIds]);
  if (eErr) {
    result.errors.push(eErr.message);
    return result;
  }

  const planned = planEventReminders(
    rows as { requester_id: string; addressee_id: string }[],
    (profiles ?? []) as {
      id: string;
      display_name: string;
      timezone: string | null;
      calendar_visibility: "private" | "friends" | "public";
    }[],
    (events ?? []) as {
      id: string;
      user_id: string;
      name: string;
      event_date: string;
      list_id: string | null;
    }[],
    now,
  );

  for (const item of planned) {
    const { title, body } = reminderCopy(
      item.kind,
      item.ownerName,
      item.eventName,
    );

    const { error: logErr } = await admin.from("event_reminder_log").insert({
      recipient_id: item.recipientId,
      event_id: item.eventId,
      kind: item.kind,
      target_date: item.eventDate,
    });

    if (logErr) {
      if (logErr.code === "23505") {
        result.skipped += 1;
        continue;
      }
      result.errors.push(logErr.message);
      continue;
    }

    const { error: noteErr } = await admin.from("event_notifications").insert({
      user_id: item.recipientId,
      event_id: item.eventId,
      kind: item.kind,
      title,
      body,
      event_date: item.eventDate,
      list_id: item.listId,
    });
    if (noteErr) {
      result.errors.push(noteErr.message);
      continue;
    }

    result.created += 1;

    const { data: tokens } = await admin
      .from("push_tokens")
      .select("token")
      .eq("user_id", item.recipientId);
    const tokenList = (tokens ?? []).map((t) => t.token as string);
    const push = await sendFcmPush(tokenList, {
      title,
      body,
      data: {
        type: "event_reminder",
        kind: item.kind,
        eventId: item.eventId,
        listId: item.listId ?? "",
      },
    });
    result.pushSent += push.sent;
  }

  return result;
}
