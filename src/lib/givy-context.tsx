"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  addItemRemote,
  claimItemRemote,
  createListRemote,
  deleteListRemote,
  duplicateListRemote,
  fetchMyLists,
  fetchPublicList,
  fetchSessionUser,
  isSupabaseConfigured,
  publishListRemote,
  removeItemRemote,
  signInWithOAuth,
  signInWithEmail as signInWithEmailRemote,
  signUpWithEmail as signUpWithEmailRemote,
  signOutRemote,
  updateItemRemote,
  updateListRemote,
  type ClaimResult,
  type EmailAuthResult,
} from "./api";
import { clearGuestCookie, isGuestAllowed, isGuestUser, setGuestCookie } from "./guest";
import {
  addItem as addItemLocal,
  claimItem as claimItemLocal,
  createList as createListLocal,
  deleteList as deleteListLocal,
  ensureSeedData,
  getActivity,
  getCurrentUser,
  getGiveaways,
  getListById,
  getPublicListByShareCode,
  getListsForUser,
  publishList as publishListLocal,
  removeItem as removeItemLocal,
  signIn as signInLocal,
  signInWithEmailLocal,
  signOut as signOutLocal,
  updateItem as updateItemLocal,
  updateList as updateListLocal,
  createGiveaway as createGiveawayStore,
  joinGiveaway as joinGiveawayStore,
  drawGiveaway as drawGiveawayStore,
  duplicateList as duplicateListLocal,
  searchLists as searchListsLocal,
  filterListsByTag as filterListsByTagLocal,
  getAllTags as getAllTagsLocal,
} from "./store";
import type {
  ActivityEvent,
  AuthProvider,
  GiftItem,
  Giveaway,
  GivyList,
  ShipPreference,
  User,
} from "./types";

type GivyContextValue = {
  ready: boolean;
  /** True when Supabase env is present (cloud OAuth available). */
  cloud: boolean;
  /** True when this session stores data only in the browser (guest / local demo). */
  localSession: boolean;
  user: User | null;
  lists: GivyList[];
  giveaways: Giveaway[];
  activity: ActivityEvent[];
  signIn: (provider: AuthProvider, next?: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    password: string,
    displayName?: string,
  ) => Promise<EmailAuthResult>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  createList: (input: {
    title: string;
    occasion: GivyList["occasion"];
    description?: string;
    eventDate: string;
    recipientAddress?: string;
    supportUrl?: string;
    supportLabel?: string;
    withDemoItems?: boolean;
  }) => Promise<GivyList | null>;
  updateList: (id: string, patch: Partial<GivyList>) => Promise<GivyList | null>;
  deleteList: (id: string) => Promise<void>;
  addItem: (
    listId: string,
    item: Omit<GiftItem, "id" | "purchased" | "purchasedAt" | "claimedByMe">,
  ) => Promise<GiftItem | null>;
  updateItem: (
    listId: string,
    itemId: string,
    patch: Partial<
      Pick<GiftItem, "title" | "notes" | "url" | "price" | "imageHint" | "quantity" | "quantityNeeded" | "priority">
    >,
  ) => Promise<GiftItem | null>;
  removeItem: (listId: string, itemId: string) => Promise<void>;
  publishList: (listId: string) => Promise<GivyList | null>;
  duplicateList: (
    sourceListId: string,
    newTitle?: string,
    newEventDate?: string,
  ) => Promise<GivyList | null>;
  searchLists: (query: string) => GivyList[];
  filterListsByTag: (tag: string) => GivyList[];
  getAllTags: () => string[];
  claimItem: (
    listId: string,
    itemId: string,
    shipPreference: ShipPreference,
  ) => Promise<ClaimResult>;
  createGiveaway: (input: {
    title: string;
    description: string;
    itemName: string;
    area: string;
    endsAt: string;
  }) => Giveaway | null;
  joinGiveaway: (id: string) => Giveaway | null;
  drawGiveaway: (id: string) => Giveaway | null;
  getList: (id: string) => GivyList | null;
  getByShare: (code: string) => Promise<GivyList | null>;
};

const GivyContext = createContext<GivyContextValue | null>(null);

function applyLocalUser(u: User | null) {
  if (u) ensureSeedData(u);
  return {
    user: u,
    lists: u ? getListsForUser(u.id) : [],
    giveaways: getGiveaways(),
    activity: getActivity(),
  };
}

export function GivyProvider({ children }: { children: ReactNode }) {
  const cloud = isSupabaseConfigured();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [lists, setLists] = useState<GivyList[]>([]);
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);

  const localSession = !cloud || isGuestUser(user);

  const refresh = useCallback(async () => {
    const local = getCurrentUser();
    if (isGuestUser(local)) {
      setGuestCookie();
      const next = applyLocalUser(local);
      setUser(next.user);
      setLists(next.lists);
      setGiveaways(next.giveaways);
      setActivity(next.activity);
      return;
    }

    if (cloud) {
      const u = await fetchSessionUser();
      if (u) {
        clearGuestCookie();
        signOutLocal();
        setUser(u);
        try {
          const mine = await fetchMyLists(u.id, u.name);
          setLists(mine);
          const derived: ActivityEvent[] = [];
          for (const list of mine) {
            for (const item of list.items) {
              if (item.purchased) {
                derived.push({
                  id: `claim_${item.id}`,
                  type: "claim",
                  message: `Someone claimed “${item.title}” (anonymous)`,
                  at: item.purchasedAt ?? list.updatedAt,
                  listId: list.id,
                });
              }
            }
            if (list.published) {
              derived.push({
                id: `pub_${list.id}`,
                type: "publish",
                message: `Shared “${list.title}”`,
                at: list.updatedAt,
                listId: list.id,
              });
            }
          }
          derived.sort((a, b) => b.at.localeCompare(a.at));
          setActivity(derived.slice(0, 40));
          setGiveaways([]);
        } catch {
          setLists([]);
          setActivity([]);
          setGiveaways([]);
        }
        return;
      }

      setUser(null);
      setLists([]);
      setActivity([]);
      setGiveaways([]);
      return;
    }

    const next = applyLocalUser(local);
    setUser(next.user);
    setLists(next.lists);
    setGiveaways(next.giveaways);
    setActivity(next.activity);
  }, [cloud]);

  useEffect(() => {
    void (async () => {
      try {
        await refresh();
      } finally {
        setReady(true);
      }
    })();
  }, [refresh]);

  const value = useMemo<GivyContextValue>(
    () => ({
      ready,
      cloud,
      localSession,
      user,
      lists,
      giveaways,
      activity,
      refresh,
      signIn: async (provider, next = "/app") => {
        if (provider === "guest") {
          if (!isGuestAllowed()) {
            throw new Error("Guest mode is disabled for this environment.");
          }
          if (cloud) {
            try {
              await signOutRemote();
            } catch {
              /* ignore — guest does not need a cloud session */
            }
          }
          signInLocal("guest");
          setGuestCookie();
          await refresh();
          return;
        }

        if (cloud) {
          if (provider === "apple") {
            throw new Error(
              "Apple sign-in comes next. Use Google or Facebook for now.",
            );
          }
          if (provider === "email") {
            throw new Error("Use the email form to sign in with email.");
          }
          clearGuestCookie();
          signOutLocal();
          await signInWithOAuth(provider, next);
          return;
        }
        clearGuestCookie();
        signInLocal(provider);
        await refresh();
      },
      signInWithEmail: async (email, password) => {
        clearGuestCookie();
        if (cloud) {
          signOutLocal();
          await signInWithEmailRemote(email, password);
          await refresh();
          return;
        }
        signInWithEmailLocal(email, password, "signin");
        await refresh();
      },
      signUpWithEmail: async (email, password, displayName) => {
        clearGuestCookie();
        if (cloud) {
          signOutLocal();
          const result = await signUpWithEmailRemote(email, password, displayName);
          if (!result.needsEmailConfirm) {
            await refresh();
          }
          return result;
        }
        signInWithEmailLocal(email, password, "signup", displayName);
        await refresh();
        return {};
      },
      signOut: async () => {
        clearGuestCookie();
        signOutLocal();
        if (cloud) await signOutRemote();
        await refresh();
      },
      createList: async (input) => {
        if (!user) return null;
        if (!localSession) {
          const list = await createListRemote({ owner: user, ...input });
          await refresh();
          return list;
        }
        const list = createListLocal({ owner: user, ...input });
        await refresh();
        return list;
      },
      updateList: async (id, patch) => {
        if (!localSession) {
          await updateListRemote(id, patch);
          await refresh();
          return lists.find((l) => l.id === id) ?? null;
        }
        const list = updateListLocal(id, patch);
        await refresh();
        return list;
      },
      deleteList: async (id) => {
        if (!localSession) await deleteListRemote(id);
        else deleteListLocal(id);
        await refresh();
      },
      addItem: async (listId, item) => {
        if (!localSession) {
          const gift = await addItemRemote(listId, item);
          await refresh();
          return gift;
        }
        const gift = addItemLocal(listId, item);
        await refresh();
        return gift;
      },
      updateItem: async (listId, itemId, patch) => {
        if (!localSession) {
          const gift = await updateItemRemote(listId, itemId, patch);
          await refresh();
          return gift;
        }
        const gift = updateItemLocal(listId, itemId, patch);
        await refresh();
        return gift;
      },
      removeItem: async (listId, itemId) => {
        if (!localSession) await removeItemRemote(listId, itemId);
        else removeItemLocal(listId, itemId);
        await refresh();
      },
      publishList: async (listId) => {
        if (!localSession) {
          await publishListRemote(listId);
          await refresh();
          return lists.find((l) => l.id === listId) ?? null;
        }
        const list = publishListLocal(listId);
        await refresh();
        return list;
      },
      duplicateList: async (sourceListId, newTitle, newEventDate) => {
        if (!user) return null;
        if (!localSession) {
          const list = await duplicateListRemote(sourceListId, user, newTitle, newEventDate);
          await refresh();
          return list;
        }
        const list = duplicateListLocal(sourceListId, user, newTitle, newEventDate);
        await refresh();
        return list;
      },
      searchLists: (query) => {
        if (!user) return [];
        if (localSession) {
          return searchListsLocal(query, user.id);
        }
        // For cloud mode, filter the already loaded lists
        if (!query.trim()) return lists;
        const lowerQuery = query.toLowerCase();
        return lists.filter(
          (list) =>
            list.title.toLowerCase().includes(lowerQuery) ||
            list.description?.toLowerCase().includes(lowerQuery) ||
            list.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery)),
        );
      },
      filterListsByTag: (tag) => {
        if (!user) return [];
        if (localSession) {
          return filterListsByTagLocal(tag, user.id);
        }
        // For cloud mode, filter the already loaded lists
        if (!tag.trim()) return lists;
        const lowerTag = tag.toLowerCase();
        return lists.filter((list) =>
          list.tags?.some((listTag) => listTag.toLowerCase() === lowerTag),
        );
      },
      getAllTags: () => {
        if (!user) return [];
        if (localSession) {
          return getAllTagsLocal(user.id);
        }
        // For cloud mode, extract tags from loaded lists
        const tagSet = new Set<string>();
        lists.forEach((list) => {
          list.tags?.forEach((tag) => tagSet.add(tag));
        });
        return Array.from(tagSet).sort();
      },
      claimItem: async (listId, itemId, shipPreference) => {
        if (localSession) {
          const localList = getListById(listId);
          if (localList && user && localList.ownerId === user.id) {
            throw new Error("You cannot claim from your own list");
          }
          if (localList) {
            const updated = claimItemLocal(listId, itemId, shipPreference);
            if (!updated) {
              return { ok: false, error: "Could not mark as purchased" };
            }
            const item = updated.items.find((i) => i.id === itemId);
            return {
              ok: true,
              recipientAddress:
                shipPreference === "to_recipient"
                  ? updated.recipientAddress ?? null
                  : null,
              ownerName: updated.ownerName,
              shipPreference: item?.shipPreference,
            };
          }
          if (cloud) {
            return {
              ok: false,
              error:
                "Guest mode can’t claim cloud lists. Sign in with Google or Facebook to claim this gift.",
            };
          }
          return { ok: false, error: "Could not mark as purchased" };
        }
        return claimItemRemote(itemId, shipPreference);
      },
      createGiveaway: (input) => {
        if (!user || !localSession) return null;
        const g = createGiveawayStore({ owner: user, ...input });
        setGiveaways(getGiveaways());
        return g;
      },
      joinGiveaway: (id) => {
        if (!user || !localSession) return null;
        const g = joinGiveawayStore(id, user.id);
        setGiveaways(getGiveaways());
        return g;
      },
      drawGiveaway: (id) => {
        if (!user || !localSession) return null;
        const g = drawGiveawayStore(id, user.id);
        setGiveaways(getGiveaways());
        return g;
      },
      getList: (id) =>
        localSession ? getListById(id) : lists.find((l) => l.id === id) ?? null,
      getByShare: async (code) => {
        // Always prefer the cloud share when configured so claims from other
        // devices show up (localStorage copies are device-local / stale).
        if (cloud) {
          try {
            const remote = await fetchPublicList(code);
            if (remote) return remote;
          } catch {
            /* fall through to local demo lists */
          }
        }
        if (localSession) {
          return getPublicListByShareCode(code);
        }
        return null;
      },
    }),
    [
      ready,
      cloud,
      localSession,
      user,
      lists,
      giveaways,
      activity,
      refresh,
    ],
  );

  return <GivyContext.Provider value={value}>{children}</GivyContext.Provider>;
}

export function useGivy() {
  const ctx = useContext(GivyContext);
  if (!ctx) throw new Error("useGivy must be used within GivyProvider");
  return ctx;
}
