import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { CalendarEvent } from "@/lib/types";

type EventRow = {
  id: string;
  user_id: string;
  name: string;
  event_date: string;
  list_id: string | null;
  created_at: string;
  updated_at: string;
};

function mapEvent(
  row: EventRow,
  opts?: { isFriendEvent?: boolean; ownerName?: string },
): CalendarEvent {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    eventDate: row.event_date,
    listId: row.list_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isFriendEvent: opts?.isFriendEvent,
    ownerName: opts?.ownerName,
  };
}

export type CreateCalendarEventInput = {
  name: string;
  eventDate: string;
  listId?: string | null;
};

export async function listMyEvents(): Promise<CalendarEvent[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("calendar_events")
    .select("*")
    .eq("user_id", user.id)
    .order("event_date", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as EventRow[]).map((row) => mapEvent(row));
}

/** Accepted friends' upcoming events (RLS enforces visibility). */
export async function listFriendEvents(fromDate?: string): Promise<CalendarEvent[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const start = fromDate ?? new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("calendar_events")
    .select("*")
    .neq("user_id", user.id)
    .gte("event_date", start)
    .order("event_date", { ascending: true })
    .limit(100);
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as EventRow[];
  const ownerIds = [...new Set(rows.map((r) => r.user_id))];
  const names = new Map<string, string>();
  if (ownerIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", ownerIds);
    for (const p of profiles ?? []) {
      names.set(p.id, p.display_name);
    }
  }

  return rows.map((row) =>
    mapEvent(row, {
      isFriendEvent: true,
      ownerName: names.get(row.user_id),
    }),
  );
}

export async function createCalendarEvent(
  input: CreateCalendarEventInput,
): Promise<CalendarEvent> {
  if (!isSupabaseConfigured()) throw new Error("Supabase is not configured.");
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const name = input.name.trim();
  if (!name) throw new Error("Event name is required.");

  const { data, error } = await supabase
    .from("calendar_events")
    .insert({
      user_id: user.id,
      name,
      event_date: input.eventDate,
      list_id: input.listId ?? null,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapEvent(data as EventRow);
}

export async function updateCalendarEvent(
  id: string,
  patch: Partial<CreateCalendarEventInput>,
): Promise<CalendarEvent> {
  if (!isSupabaseConfigured()) throw new Error("Supabase is not configured.");
  const supabase = createClient();

  const payload: Record<string, unknown> = {};
  if (patch.name !== undefined) payload.name = patch.name.trim();
  if (patch.eventDate !== undefined) payload.event_date = patch.eventDate;
  if (patch.listId !== undefined) payload.list_id = patch.listId;

  const { data, error } = await supabase
    .from("calendar_events")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapEvent(data as EventRow);
}

export async function deleteCalendarEvent(id: string): Promise<void> {
  if (!isSupabaseConfigured()) throw new Error("Supabase is not configured.");
  const supabase = createClient();
  const { error } = await supabase.from("calendar_events").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
