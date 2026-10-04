import { addDaysIso, localDateParts } from "@/lib/reminders/timezone";

export type ReminderKind = "week_before" | "day_of";

export type PlanFriendship = {
  requester_id: string;
  addressee_id: string;
};

export type PlanEvent = {
  id: string;
  user_id: string;
  name: string;
  event_date: string;
  list_id: string | null;
};

export type PlanProfile = {
  id: string;
  display_name: string;
  timezone: string | null;
  calendar_visibility: "private" | "friends" | "public";
};

export type PlannedReminder = {
  recipientId: string;
  eventId: string;
  ownerId: string;
  ownerName: string;
  eventName: string;
  eventDate: string;
  listId: string | null;
  kind: ReminderKind;
  recipientToday: string;
};

/**
 * Pure planner: which friend-event reminders should fire for `now`.
 * Uses each recipient's timezone for "today" and "today + 7 days".
 */
export function planEventReminders(
  friendships: PlanFriendship[],
  profiles: PlanProfile[],
  events: PlanEvent[],
  now = new Date(),
): PlannedReminder[] {
  const profileMap = new Map(profiles.map((p) => [p.id, p]));
  const eventsByOwner = new Map<string, PlanEvent[]>();
  for (const ev of events) {
    const list = eventsByOwner.get(ev.user_id) ?? [];
    list.push(ev);
    eventsByOwner.set(ev.user_id, list);
  }

  const friendsOf = new Map<string, string[]>();
  for (const row of friendships) {
    const a = friendsOf.get(row.requester_id) ?? [];
    a.push(row.addressee_id);
    friendsOf.set(row.requester_id, a);
    const b = friendsOf.get(row.addressee_id) ?? [];
    b.push(row.requester_id);
    friendsOf.set(row.addressee_id, b);
  }

  const out: PlannedReminder[] = [];
  const recipients = new Set<string>();
  for (const row of friendships) {
    recipients.add(row.requester_id);
    recipients.add(row.addressee_id);
  }

  for (const recipientId of recipients) {
    const recipient = profileMap.get(recipientId);
    if (!recipient) continue;

    let todayLocal: string;
    try {
      todayLocal = localDateParts(recipient.timezone || "UTC", now).iso;
    } catch {
      todayLocal = localDateParts("UTC", now).iso;
    }
    const inSeven = addDaysIso(todayLocal, 7);

    for (const ownerId of friendsOf.get(recipientId) ?? []) {
      const owner = profileMap.get(ownerId);
      if (!owner) continue;
      if (owner.calendar_visibility === "private") continue;

      for (const ev of eventsByOwner.get(ownerId) ?? []) {
        let kind: ReminderKind | null = null;
        if (ev.event_date === todayLocal) kind = "day_of";
        else if (ev.event_date === inSeven) kind = "week_before";
        if (!kind) continue;

        out.push({
          recipientId,
          eventId: ev.id,
          ownerId,
          ownerName: owner.display_name,
          eventName: ev.name,
          eventDate: ev.event_date,
          listId: ev.list_id,
          kind,
          recipientToday: todayLocal,
        });
      }
    }
  }

  return out;
}
