import type { Metadata } from "next";
import type { Occasion } from "@/lib/types";
import { OCCASION_LABELS, isOccasionKey } from "@/lib/types";
import { siteUrl } from "@/lib/site";

export type SharePreviewInput = {
  title: string;
  ownerName?: string | null;
  occasion?: string | null;
  shareCode: string;
};

/** Short Western-registry blurbs for iMessage / WhatsApp / social previews. */
const SHARE_BLURBS: Record<
  Occasion,
  (owner: string) => string
> = {
  birthday: (owner) =>
    `${owner}'s birthday wishlist on Givy. Claim a gift privately — no awkward duplicates.`,
  wedding: (owner) =>
    `${owner}'s wedding registry on Givy. Pick a gift before someone else does.`,
  holiday: (owner) =>
    `${owner}'s holiday wishlist on Givy. Claim privately so nobody buys the same gift twice.`,
  baby: (owner) =>
    `Baby shower wishlist for ${owner}. Claim a gift privately on Givy.`,
  graduation: (owner) =>
    `${owner}'s graduation wishlist on Givy. Claim a gift without the group-chat chaos.`,
  creator: (owner) =>
    `Support ${owner}'s wishlist on Givy. Claim gifts privately.`,
  other: (owner) =>
    `${owner} shared a gift list on Givy. Claim privately — no awkward duplicates.`,
};

export function resolveShareOccasion(raw: string | null | undefined): Occasion {
  if (raw && isOccasionKey(raw)) return raw;
  return "other";
}

export function sharePreviewCopy(input: {
  title: string;
  ownerName?: string | null;
  occasion?: string | null;
}): { title: string; description: string; occasion: Occasion } {
  const occasion = resolveShareOccasion(input.occasion);
  const owner = (input.ownerName?.trim() || "Someone").slice(0, 60);
  const listTitle = input.title.trim().slice(0, 60) || "Shared wishlist";
  const occasionLabel = OCCASION_LABELS[occasion];

  // Keep the first line scannable in iMessage / WhatsApp link previews.
  const title = `${listTitle} · ${occasionLabel}`.slice(0, 70);
  const description = SHARE_BLURBS[occasion](owner).slice(0, 160);

  return { title, description, occasion };
}

/** Open Graph + Twitter metadata for a public share link. */
export function buildShareMetadata(input: SharePreviewInput): Metadata {
  const { title, description } = sharePreviewCopy(input);
  const url = `${siteUrl()}/g/${encodeURIComponent(input.shareCode)}`;
  const imageUrl = `${siteUrl()}/givy-hero.jpg`;

  return {
    title,
    description,
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName: "Givy",
      title,
      description,
      url,
      images: [
        {
          url: imageUrl,
          width: 1536,
          height: 1024,
          alt: "Givy — private gift wishlists without awkward duplicates",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export function fallbackShareMetadata(): Metadata {
  return {
    title: "Shared wishlist · Givy",
    description:
      "A private gift list on Givy. Claim gifts without awkward duplicates.",
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName: "Givy",
      title: "Shared wishlist · Givy",
      description:
        "A private gift list on Givy. Claim gifts without awkward duplicates.",
      images: [
        {
          url: `${siteUrl()}/givy-hero.jpg`,
          width: 1536,
          height: 1024,
          alt: "Givy gift list",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Shared wishlist · Givy",
      description:
        "A private gift list on Givy. Claim gifts without awkward duplicates.",
      images: [`${siteUrl()}/givy-hero.jpg`],
    },
  };
}
