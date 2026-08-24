import { safeHttpsUrl, safeSupportUrl } from "@/lib/security";
import type { FundingMode, GiftItem, GivyList, Occasion } from "@/lib/types";

export type ListRow = {
  id: string;
  owner_id: string;
  title: string;
  occasion: string;
  description: string | null;
  event_date: string;
  recipient_address: string | null;
  support_url: string | null;
  support_label: string | null;
  share_code: string;
  published: boolean;
  tags?: string[] | null;
  created_at: string;
  updated_at: string;
  profiles?: { display_name: string } | { display_name: string }[] | null;
};

export type ItemRow = {
  id: string;
  list_id: string;
  title: string;
  notes: string | null;
  url: string | null;
  price: number | string | null;
  image_url: string | null;
  emoji: string | null;
  is_claimed: boolean;
  quantity?: number | null;
  quantity_needed?: number | null;
  priority?: string | null;
  funding_mode?: string | null;
  goal_minor?: number | null;
  funded_minor?: number | null;
  campaign_state?: string | null;
  contributor_count?: number | null;
  created_at: string;
};

export function sanitizeItemUrl(url?: string | null): string | null {
  if (!url) return null;
  const https = safeHttpsUrl(url);
  if (!https) throw new Error("Gift links must use https://");
  return https;
}

export function sanitizeSupportUrl(url?: string | null): string | null {
  if (url == null || url === "") return null;
  return safeSupportUrl(url);
}

export function ownerNameFrom(row: ListRow): string {
  const profile = row.profiles;
  if (!profile) return "Someone";
  if (Array.isArray(profile)) return profile[0]?.display_name ?? "Someone";
  return profile.display_name ?? "Someone";
}

export function mapFundingMode(raw: string | null | undefined): FundingMode {
  if (raw === "cash_fund" || raw === "locker_affiliate") return raw;
  return "direct_purchase";
}

export function mapItem(row: ItemRow, claimedByMe = false): GiftItem {
  const priority =
    row.priority === "high" || row.priority === "medium" || row.priority === "low"
      ? row.priority
      : undefined;
  return {
    id: row.id,
    title: row.title,
    notes: row.notes ?? undefined,
    url: row.url ?? undefined,
    price: row.price == null ? undefined : Number(row.price),
    imageHint: row.image_url ?? row.emoji ?? undefined,
    purchased: row.is_claimed,
    claimedByMe,
    quantity: row.quantity == null ? undefined : Number(row.quantity),
    quantityNeeded:
      row.quantity_needed == null ? undefined : Number(row.quantity_needed),
    priority,
    fundingMode: mapFundingMode(row.funding_mode),
    goalMinor: row.goal_minor == null ? undefined : Number(row.goal_minor),
    fundedMinor: row.funded_minor == null ? undefined : Number(row.funded_minor),
    campaignState:
      row.campaign_state === "open" ||
      row.campaign_state === "funded" ||
      row.campaign_state === "closed" ||
      row.campaign_state === "paid_out"
        ? row.campaign_state
        : undefined,
    contributorCount:
      row.contributor_count == null ? undefined : Number(row.contributor_count),
  };
}

export function mapList(row: ListRow, items: GiftItem[]): GivyList {
  return {
    id: row.id,
    ownerId: row.owner_id,
    ownerName: ownerNameFrom(row),
    title: row.title,
    occasion: row.occasion as Occasion,
    description: row.description ?? undefined,
    eventDate: row.event_date,
    recipientAddress: row.recipient_address ?? undefined,
    supportUrl: row.support_url ?? undefined,
    supportLabel: row.support_label ?? undefined,
    shareCode: row.share_code,
    published: row.published,
    tags: row.tags ?? undefined,
    items,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
