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
  addItem as addItemStore,
  claimItem as claimItemStore,
  createGiveaway as createGiveawayStore,
  createList as createListStore,
  deleteList as deleteListStore,
  drawGiveaway as drawGiveawayStore,
  ensureSeedData,
  getActivity,
  getCurrentUser,
  getGiveaways,
  getListById,
  getListByShareCode,
  getListsForUser,
  joinGiveaway as joinGiveawayStore,
  publishList as publishListStore,
  removeItem as removeItemStore,
  signIn as signInStore,
  signOut as signOutStore,
  updateList as updateListStore,
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
  user: User | null;
  lists: GivyList[];
  giveaways: Giveaway[];
  activity: ActivityEvent[];
  signIn: (provider: AuthProvider) => void;
  signOut: () => void;
  refresh: () => void;
  createList: (input: {
    title: string;
    occasion: GivyList["occasion"];
    description?: string;
    eventDate: string;
    recipientAddress?: string;
    withDemoItems?: boolean;
  }) => GivyList | null;
  updateList: (id: string, patch: Partial<GivyList>) => GivyList | null;
  deleteList: (id: string) => void;
  addItem: (
    listId: string,
    item: Omit<GiftItem, "id" | "purchased" | "purchasedAt" | "claimedByMe">,
  ) => GiftItem | null;
  removeItem: (listId: string, itemId: string) => void;
  publishList: (listId: string) => GivyList | null;
  claimItem: (
    listId: string,
    itemId: string,
    shipPreference: ShipPreference,
  ) => GivyList | null;
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
  getByShare: (code: string) => GivyList | null;
};

const GivyContext = createContext<GivyContextValue | null>(null);

export function GivyProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [lists, setLists] = useState<GivyList[]>([]);
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);

  const refresh = useCallback(() => {
    const u = getCurrentUser();
    if (u) ensureSeedData(u);
    setUser(u);
    setLists(u ? getListsForUser(u.id) : []);
    setGiveaways(getGiveaways());
    setActivity(getActivity());
  }, []);

  useEffect(() => {
    refresh();
    setReady(true);
  }, [refresh]);

  const value = useMemo<GivyContextValue>(
    () => ({
      ready,
      user,
      lists,
      giveaways,
      activity,
      refresh,
      signIn: (provider) => {
        signInStore(provider);
        refresh();
      },
      signOut: () => {
        signOutStore();
        refresh();
      },
      createList: (input) => {
        const u = getCurrentUser();
        if (!u) return null;
        const list = createListStore({ owner: u, ...input });
        refresh();
        return list;
      },
      updateList: (id, patch) => {
        const list = updateListStore(id, patch);
        refresh();
        return list;
      },
      deleteList: (id) => {
        deleteListStore(id);
        refresh();
      },
      addItem: (listId, item) => {
        const gift = addItemStore(listId, item);
        refresh();
        return gift;
      },
      removeItem: (listId, itemId) => {
        removeItemStore(listId, itemId);
        refresh();
      },
      publishList: (listId) => {
        const list = publishListStore(listId);
        refresh();
        return list;
      },
      claimItem: (listId, itemId, shipPreference) => {
        const list = claimItemStore(listId, itemId, shipPreference);
        refresh();
        return list;
      },
      createGiveaway: (input) => {
        const u = getCurrentUser();
        if (!u) return null;
        const g = createGiveawayStore({ owner: u, ...input });
        refresh();
        return g;
      },
      joinGiveaway: (id) => {
        const u = getCurrentUser();
        if (!u) return null;
        const g = joinGiveawayStore(id, u.id);
        refresh();
        return g;
      },
      drawGiveaway: (id) => {
        const u = getCurrentUser();
        if (!u) return null;
        const g = drawGiveawayStore(id, u.id);
        refresh();
        return g;
      },
      getList: (id) => getListById(id),
      getByShare: (code) => getListByShareCode(code),
    }),
    [ready, user, lists, giveaways, activity, refresh],
  );

  return <GivyContext.Provider value={value}>{children}</GivyContext.Provider>;
}

export function useGivy() {
  const ctx = useContext(GivyContext);
  if (!ctx) throw new Error("useGivy must be used within GivyProvider");
  return ctx;
}
