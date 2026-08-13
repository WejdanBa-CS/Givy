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
  fetchMyLists,
  fetchPublicList,
  fetchSessionUser,
  isSupabaseConfigured,
  publishListRemote,
  removeItemRemote,
  signInWithGoogle,
  signInWithOAuth,
  signOutRemote,
  updateItemRemote,
  updateListRemote,
  type ClaimResult,
} from "./api";
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
  getListByShareCode,
  getListsForUser,
  publishList as publishListLocal,
  removeItem as removeItemLocal,
  signIn as signInLocal,
  signOut as signOutLocal,
  updateItem as updateItemLocal,
  updateList as updateListLocal,
  createGiveaway as createGiveawayStore,
  joinGiveaway as joinGiveawayStore,
  drawGiveaway as drawGiveawayStore,
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
  /** True when Supabase env is present (cloud mode). */
  cloud: boolean;
  user: User | null;
  lists: GivyList[];
  giveaways: Giveaway[];
  activity: ActivityEvent[];
  signIn: (provider: AuthProvider, next?: string) => Promise<void>;
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
      Pick<GiftItem, "title" | "notes" | "url" | "price" | "imageHint">
    >,
  ) => Promise<GiftItem | null>;
  removeItem: (listId: string, itemId: string) => Promise<void>;
  publishList: (listId: string) => Promise<GivyList | null>;
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

export function GivyProvider({ children }: { children: ReactNode }) {
  const cloud = isSupabaseConfigured();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [lists, setLists] = useState<GivyList[]>([]);
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);

  const refresh = useCallback(async () => {
    if (cloud) {
      const u = await fetchSessionUser();
      setUser(u);
      if (u) {
        // Invite unlock only enforced when profile flag is used; MVP allows all signed-in users
        const mine = await fetchMyLists(u.id, u.name);
        setLists(mine);
        // Derive simple activity from claimed gifts so cloud owners see progress
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
      } else {
        setLists([]);
        setActivity([]);
      }
      setGiveaways([]);
      return;
    }

    const u = getCurrentUser();
    if (u) ensureSeedData(u);
    setUser(u);
    setLists(u ? getListsForUser(u.id) : []);
    setGiveaways(getGiveaways());
    setActivity(getActivity());
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
      user,
      lists,
      giveaways,
      activity,
      refresh,
      signIn: async (provider, next = "/app") => {
        if (cloud) {
          if (provider === "apple") {
            throw new Error(
              "Apple sign-in comes next. Use Google or Facebook for now.",
            );
          }
          await signInWithOAuth(provider, next);
          return;
        }
        signInLocal(provider);
        await refresh();
      },
      signOut: async () => {
        if (cloud) await signOutRemote();
        else signOutLocal();
        await refresh();
      },
      createList: async (input) => {
        if (!user) return null;
        if (cloud) {
          const list = await createListRemote({ owner: user, ...input });
          await refresh();
          return list;
        }
        const list = createListLocal({ owner: user, ...input });
        await refresh();
        return list;
      },
      updateList: async (id, patch) => {
        if (cloud) {
          await updateListRemote(id, patch);
          await refresh();
          return lists.find((l) => l.id === id) ?? null;
        }
        const list = updateListLocal(id, patch);
        await refresh();
        return list;
      },
      deleteList: async (id) => {
        if (cloud) await deleteListRemote(id);
        else deleteListLocal(id);
        await refresh();
      },
      addItem: async (listId, item) => {
        if (cloud) {
          const gift = await addItemRemote(listId, item);
          await refresh();
          return gift;
        }
        const gift = addItemLocal(listId, item);
        await refresh();
        return gift;
      },
      updateItem: async (listId, itemId, patch) => {
        if (cloud) {
          const gift = await updateItemRemote(listId, itemId, patch);
          await refresh();
          return gift;
        }
        const gift = updateItemLocal(listId, itemId, patch);
        await refresh();
        return gift;
      },
      removeItem: async (listId, itemId) => {
        if (cloud) await removeItemRemote(listId, itemId);
        else removeItemLocal(listId, itemId);
        await refresh();
      },
      publishList: async (listId) => {
        if (cloud) {
          await publishListRemote(listId);
          await refresh();
          return lists.find((l) => l.id === listId) ?? null;
        }
        const list = publishListLocal(listId);
        await refresh();
        return list;
      },
      claimItem: async (listId, itemId, shipPreference) => {
        if (cloud) {
          return claimItemRemote(itemId, shipPreference);
        }
        const updated = claimItemLocal(listId, itemId, shipPreference);
        if (!updated) return { ok: false, error: "Could not mark as purchased" };
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
      },
      createGiveaway: (input) => {
        if (!user || cloud) return null;
        const g = createGiveawayStore({ owner: user, ...input });
        setGiveaways(getGiveaways());
        return g;
      },
      joinGiveaway: (id) => {
        if (!user || cloud) return null;
        const g = joinGiveawayStore(id, user.id);
        setGiveaways(getGiveaways());
        return g;
      },
      drawGiveaway: (id) => {
        if (!user || cloud) return null;
        const g = drawGiveawayStore(id, user.id);
        setGiveaways(getGiveaways());
        return g;
      },
      getList: (id) =>
        cloud
          ? lists.find((l) => l.id === id) ?? null
          : getListById(id),
      getByShare: async (code) => {
        if (cloud) return fetchPublicList(code);
        return getListByShareCode(code);
      },
    }),
    [ready, cloud, user, lists, giveaways, activity, refresh],
  );

  return <GivyContext.Provider value={value}>{children}</GivyContext.Provider>;
}

export function useGivy() {
  const ctx = useContext(GivyContext);
  if (!ctx) throw new Error("useGivy must be used within GivyProvider");
  return ctx;
}
