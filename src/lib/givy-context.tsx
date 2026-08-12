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
  signOutRemote,
  updateListRemote,
  type ClaimResult,
} from "./api";
import {
  createGiveaway as createGiveawayStore,
  drawGiveaway as drawGiveawayStore,
  getActivity,
  getGiveaways,
  joinGiveaway as joinGiveawayStore,
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
  configured: boolean;
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
    withDemoItems?: boolean;
  }) => Promise<GivyList | null>;
  updateList: (id: string, patch: Partial<GivyList>) => Promise<GivyList | null>;
  deleteList: (id: string) => Promise<void>;
  addItem: (
    listId: string,
    item: Omit<GiftItem, "id" | "purchased" | "purchasedAt" | "claimedByMe">,
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
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [lists, setLists] = useState<GivyList[]>([]);
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const configured = isSupabaseConfigured();

  const refresh = useCallback(async () => {
    if (!configured) {
      setUser(null);
      setLists([]);
      setGiveaways([]);
      setActivity([]);
      return;
    }
    const u = await fetchSessionUser();
    setUser(u);
    if (u?.betaUnlocked) {
      setLists(await fetchMyLists(u.id, u.name));
    } else {
      setLists([]);
    }
    setGiveaways(getGiveaways());
    setActivity(getActivity());
  }, [configured]);

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
      configured,
      user,
      lists,
      giveaways,
      activity,
      refresh,
      signIn: async (provider, next = "/app") => {
        if (provider !== "google") {
          throw new Error("Closed beta uses Google sign-in only");
        }
        if (!configured) {
          throw new Error("Supabase is not configured");
        }
        await signInWithGoogle(next);
      },
      signOut: async () => {
        await signOutRemote();
        await refresh();
      },
      createList: async (input) => {
        if (!user) return null;
        const list = await createListRemote({ owner: user, ...input });
        await refresh();
        return list;
      },
      updateList: async (id, patch) => {
        await updateListRemote(id, patch);
        await refresh();
        return lists.find((l) => l.id === id) ?? null;
      },
      deleteList: async (id) => {
        await deleteListRemote(id);
        await refresh();
      },
      addItem: async (listId, item) => {
        const gift = await addItemRemote(listId, item);
        await refresh();
        return gift;
      },
      removeItem: async (listId, itemId) => {
        await removeItemRemote(listId, itemId);
        await refresh();
      },
      publishList: async (listId) => {
        await publishListRemote(listId);
        await refresh();
        return lists.find((l) => l.id === listId) ?? null;
      },
      claimItem: async (_listId, itemId, shipPreference) => {
        const result = await claimItemRemote(itemId, shipPreference);
        return result;
      },
      createGiveaway: (input) => {
        if (!user) return null;
        const g = createGiveawayStore({ owner: user, ...input });
        setGiveaways(getGiveaways());
        return g;
      },
      joinGiveaway: (id) => {
        if (!user) return null;
        const g = joinGiveawayStore(id, user.id);
        setGiveaways(getGiveaways());
        return g;
      },
      drawGiveaway: (id) => {
        if (!user) return null;
        const g = drawGiveawayStore(id, user.id);
        setGiveaways(getGiveaways());
        return g;
      },
      getList: (id) => lists.find((l) => l.id === id) ?? null,
      getByShare: async (code) => fetchPublicList(code),
    }),
    [ready, configured, user, lists, giveaways, activity, refresh],
  );

  return <GivyContext.Provider value={value}>{children}</GivyContext.Provider>;
}

export function useGivy() {
  const ctx = useContext(GivyContext);
  if (!ctx) throw new Error("useGivy must be used within GivyProvider");
  return ctx;
}
