import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Friendship, FriendshipStatus } from "@/lib/types";

type FriendshipRow = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
  updated_at: string;
};

type ProfilePeek = {
  id: string;
  display_name: string;
  username: string | null;
  avatar_hue: number;
};

export type PeopleSearchHit = {
  id: string;
  displayName: string;
  username: string | null;
  avatarHue: number;
  friendshipStatus: FriendshipStatus | null;
  friendshipId: string | null;
  isOutgoing: boolean;
};

function mapFriendship(row: FriendshipRow, peer?: ProfilePeek | null): Friendship {
  return {
    id: row.id,
    requesterId: row.requester_id,
    addresseeId: row.addressee_id,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    peer: peer
      ? {
          id: peer.id,
          name: peer.display_name,
          username: peer.username,
          avatarHue: peer.avatar_hue,
        }
      : undefined,
  };
}

export async function searchPeople(query: string): Promise<PeopleSearchHit[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createClient();
  const { data, error } = await supabase.rpc("search_people", {
    query,
    result_limit: 20,
  });
  if (error) throw new Error(error.message);
  return (data ?? []).map(
    (row: {
      id: string;
      display_name: string;
      username: string | null;
      avatar_hue: number;
      friendship_status: FriendshipStatus | null;
      friendship_id: string | null;
      is_outgoing: boolean;
    }) => ({
      id: row.id,
      displayName: row.display_name,
      username: row.username,
      avatarHue: row.avatar_hue,
      friendshipStatus: row.friendship_status,
      friendshipId: row.friendship_id,
      isOutgoing: Boolean(row.is_outgoing),
    }),
  );
}

export async function sendFriendRequest(addresseeId: string): Promise<Friendship> {
  if (!isSupabaseConfigured()) throw new Error("Supabase is not configured.");
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { data, error } = await supabase
    .from("friendships")
    .insert({
      requester_id: user.id,
      addressee_id: addresseeId,
      status: "pending",
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapFriendship(data as FriendshipRow);
}

export async function respondToFriendRequest(
  friendshipId: string,
  accept: boolean,
): Promise<void> {
  if (!isSupabaseConfigured()) throw new Error("Supabase is not configured.");
  const supabase = createClient();

  if (!accept) {
    const { error } = await supabase.from("friendships").delete().eq("id", friendshipId);
    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await supabase
    .from("friendships")
    .update({ status: "accepted" })
    .eq("id", friendshipId);
  if (error) throw new Error(error.message);
}

export async function removeFriendship(friendshipId: string): Promise<void> {
  if (!isSupabaseConfigured()) throw new Error("Supabase is not configured.");
  const supabase = createClient();
  const { error } = await supabase.from("friendships").delete().eq("id", friendshipId);
  if (error) throw new Error(error.message);
}

async function loadPeers(
  ids: string[],
): Promise<Map<string, ProfilePeek>> {
  const map = new Map<string, ProfilePeek>();
  if (ids.length === 0) return map;
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, display_name, username, avatar_hue")
    .in("id", ids);
  for (const row of data ?? []) {
    map.set(row.id, row as ProfilePeek);
  }
  return map;
}

export async function listFriendships(status?: FriendshipStatus): Promise<Friendship[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  let q = supabase
    .from("friendships")
    .select("*")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    .order("updated_at", { ascending: false });
  if (status) q = q.eq("status", status);

  const { data, error } = await q;
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as FriendshipRow[];
  const peerIds = rows.map((r) =>
    r.requester_id === user.id ? r.addressee_id : r.requester_id,
  );
  const peers = await loadPeers(peerIds);
  return rows.map((row) => {
    const peerId = row.requester_id === user.id ? row.addressee_id : row.requester_id;
    return mapFriendship(row, peers.get(peerId));
  });
}

export async function listPendingIncoming(): Promise<Friendship[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("friendships")
    .select("*")
    .eq("addressee_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as FriendshipRow[];
  const peers = await loadPeers(rows.map((r) => r.requester_id));
  return rows.map((row) => mapFriendship(row, peers.get(row.requester_id)));
}
