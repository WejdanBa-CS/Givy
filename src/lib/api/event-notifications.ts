import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { ReminderKind } from "@/lib/reminders/plan";

export type EventNotification = {
  id: string;
  kind: ReminderKind;
  title: string;
  body: string;
  eventDate?: string | null;
  listId?: string | null;
  at: string;
  read: boolean;
};

export async function fetchEventNotifications(): Promise<EventNotification[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await createClient()
    .from("event_notifications")
    .select("id, kind, title, body, event_date, list_id, created_at, read_at")
    .order("created_at", { ascending: false })
    .limit(40);
  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id as string,
    kind: row.kind as ReminderKind,
    title: row.title as string,
    body: row.body as string,
    eventDate: row.event_date as string | null,
    listId: row.list_id as string | null,
    at: row.created_at as string,
    read: Boolean(row.read_at),
  }));
}

export async function markEventNotificationsRead(ids?: string[]): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = createClient();
  let query = supabase
    .from("event_notifications")
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null);
  if (ids?.length) query = query.in("id", ids);
  const { error } = await query;
  if (error) throw error;
}

export async function registerPushToken(
  token: string,
  platform: "android" | "ios" | "web" = "android",
): Promise<void> {
  const res = await fetch("/api/push/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, platform }),
  });
  if (!res.ok) {
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(json.error || "Could not register push token");
  }
}
