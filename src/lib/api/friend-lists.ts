import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export type FriendListPeek = {
  id: string;
  title: string;
  occasion: string;
  description: string | null;
  eventDate: string;
  shareCode: string;
  published: boolean;
  updatedAt: string;
};

/** Published wishlists of a friend/public profile — never includes shipping address. */
export async function fetchFriendLists(ownerId: string): Promise<FriendListPeek[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_friend_lists", {
    p_owner_id: ownerId,
  });
  if (error) throw new Error(error.message);
  return (data ?? []).map(
    (row: {
      id: string;
      title: string;
      occasion: string;
      description: string | null;
      event_date: string;
      share_code: string;
      published: boolean;
      updated_at: string;
    }) => ({
      id: row.id,
      title: row.title,
      occasion: row.occasion,
      description: row.description,
      eventDate: row.event_date,
      shareCode: row.share_code,
      published: row.published,
      updatedAt: row.updated_at,
    }),
  );
}
