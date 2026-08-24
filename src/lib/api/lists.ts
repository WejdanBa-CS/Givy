import { customAlphabet } from "nanoid";
import { createClient } from "@/lib/supabase/client";
import { DEMO_SEED_ITEMS, type GiftItem, type GivyList, type Occasion, type User } from "@/lib/types";
import { mapItem, mapList, mapFundingMode, sanitizeItemUrl, sanitizeSupportUrl, type ItemRow, type ListRow } from "./mappers";

const shareCode = customAlphabet("abcdefghjkmnpqrstuvwxyz23456789", 10);

export async function fetchMyLists(userId: string, ownerName: string): Promise<GivyList[]> {
  const supabase = createClient();
  const { data: lists, error } = await supabase
    .from("lists")
    .select("*")
    .eq("owner_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  if (!lists?.length) return [];

  const ids = lists.map((list) => list.id);
  const { data: items, error: itemsError } = await supabase
    .from("items")
    .select("*")
    .in("list_id", ids)
    .order("created_at", { ascending: true });
  if (itemsError) throw itemsError;

  const { data: campaigns } = await supabase
    .from("funding_campaigns")
    .select("item_id, funded_minor, target_minor, state")
    .in("list_id", ids);
  const campaignByItem = new Map(
    (campaigns ?? []).map((campaign) => [campaign.item_id as string, campaign]),
  );

  const byList = new Map<string, GiftItem[]>();
  for (const item of items ?? []) {
    const listItems = byList.get(item.list_id) ?? [];
    const campaign = campaignByItem.get(item.id);
    listItems.push(
      mapItem({
        ...(item as ItemRow),
        funded_minor: campaign?.funded_minor ?? null,
        goal_minor: campaign?.target_minor ?? (item as ItemRow).goal_minor,
        campaign_state: campaign?.state ?? null,
      }),
    );
    byList.set(item.list_id, listItems);
  }

  return (lists as ListRow[]).map((row) =>
    mapList({ ...row, profiles: { display_name: ownerName } }, byList.get(row.id) ?? []),
  );
}

export async function createListRemote(input: {
  owner: User;
  title: string;
  occasion: Occasion;
  description?: string;
  eventDate: string;
  recipientAddress?: string;
  supportUrl?: string;
  supportLabel?: string;
  withDemoItems?: boolean;
}): Promise<GivyList> {
  const supabase = createClient();
  const { data: list, error } = await supabase
    .from("lists")
    .insert({
      owner_id: input.owner.id,
      title: input.title,
      occasion: input.occasion,
      description: input.description ?? null,
      event_date: input.eventDate,
      recipient_address: input.recipientAddress ?? null,
      support_url: sanitizeSupportUrl(input.supportUrl ?? null),
      support_label: input.supportLabel ?? null,
      share_code: shareCode(),
      published: false,
    })
    .select("*")
    .single();
  if (error) throw error;

  let gifts: GiftItem[] = [];
  if (input.withDemoItems) {
    const rows = DEMO_SEED_ITEMS.map((item) => ({
      list_id: list.id,
      title: item.title,
      notes: item.notes ?? null,
      url: sanitizeItemUrl(item.url),
      price: item.price ?? null,
      image_url: sanitizeItemUrl(item.imageHint),
      emoji: null,
      is_claimed: false,
      funding_mode: item.fundingMode ?? "direct_purchase",
      goal_minor: item.goalMinor ?? null,
    }));
    const { data: inserted, error: itemError } = await supabase
      .from("items")
      .insert(rows)
      .select("*");
    if (itemError) throw itemError;
    gifts = (inserted as ItemRow[]).map((row) => mapItem(row));
  }

  return mapList(
    { ...(list as ListRow), profiles: { display_name: input.owner.name } },
    gifts,
  );
}

export async function updateListRemote(id: string, patch: Partial<GivyList>): Promise<void> {
  const supabase = createClient();
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.title !== undefined) payload.title = patch.title;
  if (patch.occasion !== undefined) payload.occasion = patch.occasion;
  if (patch.description !== undefined) payload.description = patch.description;
  if (patch.eventDate !== undefined) payload.event_date = patch.eventDate;
  if (patch.recipientAddress !== undefined) payload.recipient_address = patch.recipientAddress;
  if (patch.supportUrl !== undefined) payload.support_url = sanitizeSupportUrl(patch.supportUrl || null);
  if (patch.supportLabel !== undefined) payload.support_label = patch.supportLabel || null;
  if (patch.published !== undefined) payload.published = patch.published;
  if (patch.tags !== undefined) payload.tags = patch.tags;

  const { error } = await supabase.from("lists").update(payload).eq("id", id);
  if (error) throw error;
}

export async function deleteListRemote(id: string): Promise<void> {
  const { error } = await createClient().from("lists").delete().eq("id", id);
  if (error) throw error;
}

export async function publishListRemote(listId: string): Promise<void> {
  await updateListRemote(listId, { published: true });
}

export async function fetchPublicList(code: string): Promise<GivyList | null> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_public_list", { p_share_code: code });
  if (error) throw error;
  if (!data) return null;

  const payload = data as {
    id: string;
    title: string;
    occasion: string;
    description: string | null;
    event_date: string;
    share_code: string;
    owner_name: string;
    support_url?: string | null;
    support_label?: string | null;
    has_recipient_address?: boolean;
    items: Array<ItemRow & { claimed_by_me?: boolean }>;
  };

  return {
    id: payload.id,
    ownerId: "",
    ownerName: payload.owner_name,
    title: payload.title,
    occasion: payload.occasion as Occasion,
    description: payload.description ?? undefined,
    eventDate: payload.event_date,
    shareCode: payload.share_code,
    published: true,
    recipientAddress: undefined,
    supportUrl: payload.support_url ?? undefined,
    supportLabel: payload.support_label ?? undefined,
    hasRecipientAddress: Boolean(payload.has_recipient_address),
    createdAt: "",
    updatedAt: "",
    items: (payload.items ?? []).map((item) =>
      mapItem(item, Boolean(item.claimed_by_me)),
    ),
  };
}

export async function duplicateListRemote(
  sourceListId: string,
  owner: User,
  newTitle?: string,
  newEventDate?: string,
): Promise<GivyList> {
  const supabase = createClient();
  const { data: sourceList, error: fetchError } = await supabase
    .from("lists")
    .select("*")
    .eq("id", sourceListId)
    .single();
  if (fetchError) throw fetchError;

  const { data: sourceItems, error: itemsError } = await supabase
    .from("items")
    .select("*")
    .eq("list_id", sourceListId);
  if (itemsError) throw itemsError;

  const { data: newList, error: createError } = await supabase
    .from("lists")
    .insert({
      owner_id: owner.id,
      title: newTitle || sourceList.title,
      occasion: sourceList.occasion,
      description: sourceList.description,
      event_date: newEventDate || sourceList.event_date,
      recipient_address: sourceList.recipient_address,
      support_url: sourceList.support_url,
      support_label: sourceList.support_label,
      share_code: shareCode(),
      published: false,
    })
    .select("*")
    .single();
  if (createError) throw createError;

  if (sourceItems?.length) {
    const newItemRows = sourceItems.map((item: ItemRow) => ({
      list_id: newList.id,
      title: item.title,
      notes: item.notes,
      url: item.url,
      price: item.price,
      image_url: item.image_url,
      emoji: item.emoji,
      is_claimed: false,
      quantity: item.quantity,
      quantity_needed: item.quantity_needed,
      priority: item.priority,
      funding_mode: mapFundingMode(item.funding_mode),
      goal_minor: item.goal_minor,
    }));
    const { error: insertItemsError } = await supabase.from("items").insert(newItemRows);
    if (insertItemsError) throw insertItemsError;
  }

  const lists = await fetchMyLists(owner.id, owner.name);
  return lists.find((list) => list.id === newList.id) || mapList(newList as ListRow, []);
}
