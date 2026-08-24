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
  createListRemote,
  deleteListRemote,
  duplicateListRemote,
  fetchMyLists,
  fetchPublicList,
  publishListRemote,
  updateListRemote,
} from "@/lib/api";
import {
  createGiveaway as createGiveawayStore,
  createList as createListLocal,
  deleteList as deleteListLocal,
  ensureSeedData,
  drawGiveaway as drawGiveawayStore,
  filterListsByTag as filterListsByTagLocal,
  getActivity,
  getAllTags as getAllTagsLocal,
  getGiveaways,
  getListById,
  getListsForUser,
  getPublicListByShareCode,
  joinGiveaway as joinGiveawayStore,
  publishList as publishListLocal,
  searchLists as searchListsLocal,
  updateList as updateListLocal,
  duplicateList as duplicateListLocal,
} from "@/lib/store";
import type { ActivityEvent, Giveaway, GivyList } from "@/lib/types";
import { useAuth } from "./auth-context";
import type { ListContextValue } from "./types";

const ListContext = createContext<ListContextValue | null>(null);

function deriveActivity(lists: GivyList[]): ActivityEvent[] {
  const activity: ActivityEvent[] = [];
  for (const list of lists) {
    for (const item of list.items) {
      if (item.purchased) {
        activity.push({
          id: `claim_${item.id}`,
          type: "claim",
          message: `Someone claimed “${item.title}” (anonymous)`,
          at: item.purchasedAt ?? list.updatedAt,
          listId: list.id,
        });
      }
    }
    if (list.published) {
      activity.push({
        id: `pub_${list.id}`,
        type: "publish",
        message: `Shared “${list.title}”`,
        at: list.updatedAt,
        listId: list.id,
      });
    }
  }
  return activity.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 40);
}

export function ListProvider({ children }: { children: ReactNode }) {
  const { cloud, localSession, user } = useAuth();
  const [lists, setLists] = useState<GivyList[]>([]);
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);

  const refresh = useCallback(async () => {
    if (localSession) {
      if (user) ensureSeedData(user);
      setLists(user ? getListsForUser(user.id) : []);
      setGiveaways(getGiveaways());
      setActivity(getActivity());
      return;
    }

    if (cloud && user) {
      try {
        const mine = await fetchMyLists(user.id, user.name);
        setLists(mine);
        setActivity(deriveActivity(mine));
        setGiveaways([]);
      } catch {
        setLists([]);
        setActivity([]);
        setGiveaways([]);
      }
      return;
    }

    setLists([]);
    setActivity([]);
    setGiveaways([]);
  }, [cloud, localSession, user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<ListContextValue>(
    () => ({
      lists,
      giveaways,
      activity,
      refresh,
      createList: async (input) => {
        if (!user) return null;
        const list = localSession
          ? createListLocal({ owner: user, ...input })
          : await createListRemote({ owner: user, ...input });
        await refresh();
        return list;
      },
      updateList: async (id, patch) => {
        if (!localSession) {
          await updateListRemote(id, patch);
          await refresh();
          return lists.find((list) => list.id === id) ?? null;
        }
        const list = updateListLocal(id, patch);
        await refresh();
        return list;
      },
      deleteList: async (id) => {
        if (localSession) deleteListLocal(id);
        else await deleteListRemote(id);
        await refresh();
      },
      publishList: async (listId) => {
        if (!localSession) {
          await publishListRemote(listId);
          await refresh();
          return lists.find((list) => list.id === listId) ?? null;
        }
        const list = publishListLocal(listId);
        await refresh();
        return list;
      },
      duplicateList: async (sourceListId, newTitle, newEventDate) => {
        if (!user) return null;
        const list = localSession
          ? duplicateListLocal(sourceListId, user, newTitle, newEventDate)
          : await duplicateListRemote(sourceListId, user, newTitle, newEventDate);
        await refresh();
        return list;
      },
      searchLists: (query) => {
        if (!user) return [];
        if (localSession) return searchListsLocal(query, user.id);
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
        if (localSession) return filterListsByTagLocal(tag, user.id);
        if (!tag.trim()) return lists;
        const lowerTag = tag.toLowerCase();
        return lists.filter((list) =>
          list.tags?.some((listTag) => listTag.toLowerCase() === lowerTag),
        );
      },
      getAllTags: () => {
        if (!user) return [];
        if (localSession) return getAllTagsLocal(user.id);
        const tagSet = new Set<string>();
        lists.forEach((list) => list.tags?.forEach((tag) => tagSet.add(tag)));
        return Array.from(tagSet).sort();
      },
      createGiveaway: (input) => {
        if (!user || !localSession) return null;
        const giveaway = createGiveawayStore({ owner: user, ...input });
        setGiveaways(getGiveaways());
        return giveaway;
      },
      joinGiveaway: (id) => {
        if (!user || !localSession) return null;
        const giveaway = joinGiveawayStore(id, user.id);
        setGiveaways(getGiveaways());
        return giveaway;
      },
      drawGiveaway: (id) => {
        if (!user || !localSession) return null;
        const giveaway = drawGiveawayStore(id, user.id);
        setGiveaways(getGiveaways());
        return giveaway;
      },
      getList: (id) => (localSession ? getListById(id) : lists.find((list) => list.id === id) ?? null),
      getByShare: async (code) => {
        if (cloud) {
          try {
            const remote = await fetchPublicList(code);
            if (remote) return remote;
          } catch {
            // Fall through to local demo data when a cloud lookup is unavailable.
          }
        }
        return localSession ? getPublicListByShareCode(code) : null;
      },
    }),
    [activity, cloud, giveaways, lists, localSession, refresh, user],
  );

  return <ListContext.Provider value={value}>{children}</ListContext.Provider>;
}

export function useLists() {
  const context = useContext(ListContext);
  if (!context) throw new Error("useLists must be used within ListProvider");
  return context;
}
