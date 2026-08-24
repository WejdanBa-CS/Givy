import { createClient } from "@/lib/supabase/client";

export type ClaimNotification = {
  id: string;
  listId: string;
  itemId: string;
  listTitle: string;
  itemTitle: string;
  at: string;
  read: boolean;
};

export async function fetchClaimNotifications(): Promise<ClaimNotification[]> {
  const { data, error } = await createClient()
    .from("claim_notifications")
    .select("id, list_id, item_id, list_title, item_title, created_at, read_at")
    .order("created_at", { ascending: false })
    .limit(40);
  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id as string,
    listId: row.list_id as string,
    itemId: row.item_id as string,
    listTitle: row.list_title as string,
    itemTitle: row.item_title as string,
    at: row.created_at as string,
    read: Boolean(row.read_at),
  }));
}

export async function markClaimNotificationsRead(ids?: string[]): Promise<void> {
  const supabase = createClient();
  let query = supabase
    .from("claim_notifications")
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null);
  if (ids?.length) query = query.in("id", ids);
  const { error } = await query;
  if (error) throw error;
}
