"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  listFriendships,
  listPendingIncoming,
  removeFriendship,
  respondToFriendRequest,
  searchPeople,
  sendFriendRequest,
  type PeopleSearchHit,
} from "@/lib/api/friends";
import {
  fetchFriendLists,
  type FriendListPeek,
} from "@/lib/api/friend-lists";
import type { Friendship } from "@/lib/types";
import { isSupabaseConfigured } from "@/lib/supabase/client";

function Avatar({ name, hue }: { name: string; hue: number }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <span
      className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-bold text-white"
      style={{ background: `hsl(${hue} 55% 42%)` }}
    >
      {initials || "?"}
    </span>
  );
}

export default function FriendsPage() {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<PeopleSearchHit[]>([]);
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [incoming, setIncoming] = useState<Friendship[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [openPeerId, setOpenPeerId] = useState<string | null>(null);
  const [peekLists, setPeekLists] = useState<FriendListPeek[]>([]);
  const [peekLoading, setPeekLoading] = useState(false);
  const [peekNote, setPeekNote] = useState<string | null>(null);
  const configured = isSupabaseConfigured();

  const refresh = useCallback(async () => {
    if (!configured) return;
    try {
      const [f, p] = await Promise.all([
        listFriendships("accepted"),
        listPendingIncoming(),
      ]);
      setFriends(f);
      setIncoming(p);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load friends.");
    }
  }, [configured]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!configured) return;
    const q = query.trim();
    if (q.length < 2) {
      setHits([]);
      return;
    }
    const t = setTimeout(() => {
      setSearching(true);
      void searchPeople(q)
        .then(setHits)
        .catch((e: unknown) =>
          setError(e instanceof Error ? e.message : "Search failed."),
        )
        .finally(() => setSearching(false));
    }, 280);
    return () => clearTimeout(t);
  }, [query, configured]);

  async function onAdd(userId: string) {
    setBusyId(userId);
    try {
      await sendFriendRequest(userId);
      await refresh();
      setHits((prev) =>
        prev.map((h) =>
          h.id === userId
            ? { ...h, friendshipStatus: "pending", isOutgoing: true }
            : h,
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send request.");
    } finally {
      setBusyId(null);
    }
  }

  async function onRespond(id: string, accept: boolean) {
    setBusyId(id);
    try {
      await respondToFriendRequest(id, accept);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update request.");
    } finally {
      setBusyId(null);
    }
  }

  async function onRemove(id: string) {
    setBusyId(id);
    try {
      await removeFriendship(id);
      await refresh();
      setOpenPeerId(null);
      setPeekLists([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not remove friend.");
    } finally {
      setBusyId(null);
    }
  }

  async function onToggleWishlists(peerId: string) {
    if (openPeerId === peerId) {
      setOpenPeerId(null);
      setPeekLists([]);
      setPeekNote(null);
      return;
    }
    setOpenPeerId(peerId);
    setPeekLists([]);
    setPeekNote(null);
    setPeekLoading(true);
    try {
      const lists = await fetchFriendLists(peerId);
      setPeekLists(lists);
      if (lists.length === 0) {
        setPeekNote(
          "No published wishlists visible — they may be private or empty.",
        );
      }
    } catch (e) {
      setPeekNote(
        e instanceof Error ? e.message : "Could not load wishlists.",
      );
    } finally {
      setPeekLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg animate-rise space-y-5">
      <div>
        <h1 className="font-display text-4xl tracking-tight text-ink">Friends</h1>
        <p className="mt-1 text-ink-soft">
          Find people, accept requests, and peek at friends&apos; published
          wishlists.
        </p>
      </div>

      {!configured && (
        <p className="panel px-5 py-4 text-sm text-ink-soft">
          Sign in with a live account to use friends. Demo mode has no social graph.
        </p>
      )}

      {error && (
        <p className="rounded-2xl border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-coral-deep">
          {error}
        </p>
      )}

      <section className="panel space-y-3 p-4 sm:p-5">
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-ink-soft">
            Search
          </span>
          <input
            className="field mt-1.5 w-full"
            placeholder="Username, name, or email"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={!configured}
          />
        </label>
        {searching && <p className="text-xs text-ink-soft">Searching…</p>}
        {hits.length > 0 && (
          <ul className="divide-y divide-[var(--line)] overflow-hidden rounded-2xl border border-[var(--line)]">
            {hits.map((hit) => (
              <li key={hit.id} className="flex items-center gap-3 px-3 py-3">
                <Avatar name={hit.displayName} hue={hit.avatarHue} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{hit.displayName}</p>
                  <p className="truncate text-xs text-ink-soft">
                    {hit.username ? `@${hit.username}` : "No username yet"}
                  </p>
                </div>
                {hit.friendshipStatus === "accepted" ? (
                  <span className="text-xs font-bold text-leaf">Friends</span>
                ) : hit.friendshipStatus === "pending" ? (
                  <span className="text-xs font-bold text-ink-soft">
                    {hit.isOutgoing ? "Sent" : "Incoming"}
                  </span>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary px-3 py-2 text-xs"
                    disabled={busyId === hit.id}
                    onClick={() => void onAdd(hit.id)}
                  >
                    Add
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-2xl text-ink">Requests</h2>
        <ul className="panel divide-y divide-[var(--line)] overflow-hidden">
          {incoming.map((req) => (
            <li key={req.id} className="flex items-center gap-3 px-4 py-3">
              <Avatar
                name={req.peer?.name ?? "Friend"}
                hue={req.peer?.avatarHue ?? 180}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{req.peer?.name ?? "Someone"}</p>
                <p className="text-xs text-ink-soft">Wants to be friends</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn btn-primary px-3 py-2 text-xs"
                  disabled={busyId === req.id}
                  onClick={() => void onRespond(req.id, true)}
                >
                  Accept
                </button>
                <button
                  type="button"
                  className="btn btn-secondary px-3 py-2 text-xs"
                  disabled={busyId === req.id}
                  onClick={() => void onRespond(req.id, false)}
                >
                  Decline
                </button>
              </div>
            </li>
          ))}
          {incoming.length === 0 && (
            <li className="px-5 py-6 text-center text-sm text-ink-soft">
              No pending requests.
            </li>
          )}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-2xl text-ink">Your friends</h2>
        <ul className="panel divide-y divide-[var(--line)] overflow-hidden">
          {friends.map((f) => {
            const peerId = f.peer?.id;
            const open = peerId != null && openPeerId === peerId;
            return (
              <li key={f.id} className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Avatar
                    name={f.peer?.name ?? "Friend"}
                    hue={f.peer?.avatarHue ?? 180}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">
                      {f.peer?.name ?? "Friend"}
                    </p>
                    <p className="truncate text-xs text-ink-soft">
                      {f.peer?.username ? `@${f.peer.username}` : "Friend"}
                    </p>
                  </div>
                  {peerId && (
                    <button
                      type="button"
                      className="text-xs font-bold text-coral-deep"
                      onClick={() => void onToggleWishlists(peerId)}
                    >
                      {open ? "Hide lists" : "Wishlists"}
                    </button>
                  )}
                  <button
                    type="button"
                    className="text-xs font-bold text-ink-soft hover:text-coral-deep"
                    disabled={busyId === f.id}
                    onClick={() => void onRemove(f.id)}
                  >
                    Remove
                  </button>
                </div>
                {open && (
                  <div className="mt-3 rounded-2xl border border-[var(--line)] bg-mist/40 px-3 py-2">
                    {peekLoading && (
                      <p className="text-xs text-ink-soft">Loading…</p>
                    )}
                    {!peekLoading && peekNote && (
                      <p className="text-xs text-ink-soft">{peekNote}</p>
                    )}
                    {!peekLoading && peekLists.length > 0 && (
                      <ul className="space-y-2">
                        {peekLists.map((list) => (
                          <li
                            key={list.id}
                            className="flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-ink">
                                {list.title}
                              </p>
                              <p className="truncate text-xs text-ink-soft">
                                {list.occasion} · {list.eventDate}
                              </p>
                            </div>
                            <Link
                              href={`/g/${list.shareCode}`}
                              className="shrink-0 text-xs font-bold text-coral-deep"
                            >
                              Open
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </li>
            );
          })}
          {friends.length === 0 && (
            <li className="px-5 py-6 text-center text-sm text-ink-soft">
              No friends yet. Search above to add someone.
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
