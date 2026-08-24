import { createClient } from "@/lib/supabase/client";
import { mapFundingRpcError } from "@/lib/site";
import type { GiftItem, ShipPreference } from "@/lib/types";
import { mapItem, sanitizeItemUrl, type ItemRow } from "./mappers";

export type ClaimResult = {
  ok: boolean;
  recipientAddress?: string | null;
  ownerName?: string;
  shipPreference?: string;
  error?: string;
};

export type PledgeResult = {
  ok: boolean;
  fundedMinor: number;
  targetMinor: number;
  state: string;
  contributorCount: number;
};

export async function addItemRemote(
  listId: string,
  item: Omit<GiftItem, "id" | "purchased" | "purchasedAt" | "claimedByMe">,
): Promise<GiftItem> {
  const { data, error } = await createClient()
    .from("items")
    .insert({
      list_id: listId,
      title: item.title,
      notes: item.notes ?? null,
      url: sanitizeItemUrl(item.url),
      price: item.price ?? null,
      image_url: sanitizeItemUrl(item.imageHint),
      is_claimed: false,
      quantity: item.quantity ?? 1,
      quantity_needed: item.quantityNeeded ?? item.quantity ?? 1,
      priority: item.priority ?? null,
      funding_mode: item.fundingMode ?? "direct_purchase",
      goal_minor: item.goalMinor ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapItem(data as ItemRow);
}

export async function removeItemRemote(listId: string, itemId: string): Promise<void> {
  const { error } = await createClient()
    .from("items")
    .delete()
    .eq("id", itemId)
    .eq("list_id", listId);
  if (error) throw error;
}

export async function updateItemRemote(
  listId: string,
  itemId: string,
  patch: Partial<
    Pick<
      GiftItem,
      | "title"
      | "notes"
      | "url"
      | "price"
      | "imageHint"
      | "quantity"
      | "quantityNeeded"
      | "priority"
      | "fundingMode"
      | "goalMinor"
    >
  >,
): Promise<GiftItem> {
  const payload: Record<string, unknown> = {};
  if (patch.title !== undefined) payload.title = patch.title;
  if (patch.notes !== undefined) payload.notes = patch.notes ?? null;
  if (patch.url !== undefined) payload.url = sanitizeItemUrl(patch.url);
  if (patch.price !== undefined) payload.price = patch.price ?? null;
  if (patch.imageHint !== undefined) payload.image_url = sanitizeItemUrl(patch.imageHint);
  if (patch.quantity !== undefined) payload.quantity = patch.quantity;
  if (patch.quantityNeeded !== undefined) payload.quantity_needed = patch.quantityNeeded;
  if (patch.priority !== undefined) payload.priority = patch.priority;
  if (patch.fundingMode !== undefined) payload.funding_mode = patch.fundingMode;
  if (patch.goalMinor !== undefined) payload.goal_minor = patch.goalMinor;

  const { data, error } = await createClient()
    .from("items")
    .update(payload)
    .eq("id", itemId)
    .eq("list_id", listId)
    .eq("is_claimed", false)
    .select("*")
    .single();
  if (error) throw error;
  return mapItem(data as ItemRow);
}

export async function pledgeContributionRemote(input: {
  itemId: string;
  amountMinor: number;
  giverName?: string;
  message?: string;
  anonymous?: boolean;
}): Promise<PledgeResult> {
  if (
    !Number.isFinite(input.amountMinor) ||
    input.amountMinor < 100 ||
    input.amountMinor > 5_000_000
  ) {
    throw new Error("Pledge must be between $1 and $50,000");
  }
  const { data, error } = await createClient().rpc("pledge_contribution", {
    p_item_id: input.itemId,
    p_amount_minor: input.amountMinor,
    p_giver_name: input.giverName ?? null,
    p_message: input.message ?? null,
    p_anonymous: input.anonymous ?? true,
  });
  if (error) throw mapFundingRpcError(error.message);
  const payload = data as {
    ok?: boolean;
    funded_minor?: number;
    target_minor?: number;
    state?: string;
    contributor_count?: number;
  };
  return {
    ok: Boolean(payload?.ok),
    fundedMinor: Number(payload?.funded_minor ?? 0),
    targetMinor: Number(payload?.target_minor ?? 0),
    state: String(payload?.state ?? "open"),
    contributorCount: Number(payload?.contributor_count ?? 0),
  };
}

export async function claimItemRemote(
  itemId: string,
  shipPreference: ShipPreference,
): Promise<ClaimResult> {
  const { data, error } = await createClient().rpc("claim_item", {
    p_item_id: itemId,
    p_ship_preference: shipPreference,
  });
  if (error) return { ok: false, error: error.message };
  const result = data as {
    ok: boolean;
    recipient_address?: string | null;
    owner_name?: string;
  };
  if (result?.ok) {
    // Fire-and-forget owner email; the RPC also writes the in-app notification.
    void fetch("/api/claims/notify-owner", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId }),
    }).catch(() => {});
  }
  return {
    ok: Boolean(result?.ok),
    recipientAddress: result?.recipient_address ?? null,
    ownerName: result?.owner_name,
  };
}
