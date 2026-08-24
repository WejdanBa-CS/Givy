"use client";

import {
  addItemRemote,
  claimItemRemote,
  pledgeContributionRemote,
  removeItemRemote,
  updateItemRemote,
} from "@/lib/api";
import {
  addItem as addItemLocal,
  claimItem as claimItemLocal,
  getListById,
  pledgeItem as pledgeItemLocal,
  removeItem as removeItemLocal,
  updateItem as updateItemLocal,
} from "@/lib/store";
import { useCallback } from "react";
import { useAuth } from "./auth-context";
import { useLists } from "./list-context";
import type { ItemActions } from "./types";

export function useItemActions(): ItemActions {
  const { cloud, localSession, user } = useAuth();
  const { refresh } = useLists();

  const addItem = useCallback<ItemActions["addItem"]>(
    async (listId, item) => {
      const gift = localSession
        ? addItemLocal(listId, item)
        : await addItemRemote(listId, item);
      await refresh();
      return gift;
    },
    [localSession, refresh],
  );

  const updateItem = useCallback<ItemActions["updateItem"]>(
    async (listId, itemId, patch) => {
      const gift = localSession
        ? updateItemLocal(listId, itemId, patch)
        : await updateItemRemote(listId, itemId, patch);
      await refresh();
      return gift;
    },
    [localSession, refresh],
  );

  const removeItem = useCallback<ItemActions["removeItem"]>(
    async (listId, itemId) => {
      if (localSession) removeItemLocal(listId, itemId);
      else await removeItemRemote(listId, itemId);
      await refresh();
    },
    [localSession, refresh],
  );

  const claimItem = useCallback<ItemActions["claimItem"]>(
    async (listId, itemId, shipPreference) => {
      if (!localSession) return claimItemRemote(itemId, shipPreference);

      const localList = getListById(listId);
      if (localList && user && localList.ownerId === user.id) {
        throw new Error("You cannot claim from your own list");
      }
      if (localList) {
        const updated = claimItemLocal(listId, itemId, shipPreference);
        if (!updated) return { ok: false, error: "Could not mark as purchased" };
        const item = updated.items.find((candidate) => candidate.id === itemId);
        await refresh();
        return {
          ok: true,
          recipientAddress:
            shipPreference === "to_recipient" ? updated.recipientAddress ?? null : null,
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
    },
    [cloud, localSession, refresh, user],
  );

  const pledgeContribution = useCallback<ItemActions["pledgeContribution"]>(
    async (input) => {
      if (localSession) {
        const localList = getListById(input.listId);
        if (localList) {
          const next = pledgeItemLocal(input.listId, input.itemId, input.amountMinor);
          if (!next) throw new Error("Could not record this pledge");
          await refresh();
          return {
            ok: true,
            fundedMinor: next.fundedMinor ?? input.amountMinor,
            targetMinor: next.goalMinor ?? 0,
            state: next.campaignState ?? "open",
            contributorCount: next.contributorCount ?? 1,
          };
        }
        if (!cloud) throw new Error("Could not record this pledge");
      }
      const result = await pledgeContributionRemote({
        itemId: input.itemId,
        amountMinor: input.amountMinor,
        giverName: input.giverName,
        message: input.message,
        anonymous: input.anonymous,
      });
      await refresh();
      return result;
    },
    [cloud, localSession, refresh],
  );

  return { addItem, updateItem, removeItem, claimItem, pledgeContribution };
}
