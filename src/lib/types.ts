export type Occasion =
  | "birthday"
  | "wedding"
  | "holiday"
  | "baby"
  | "graduation"
  | "creator"
  | "other";

export type AuthProvider = "google" | "apple" | "facebook" | "guest" | "email";

export type ShipPreference = "to_giver" | "to_recipient";

export type GiveawayStatus = "open" | "drawn" | "closed";

export interface User {
  id: string;
  name: string;
  email: string;
  provider: AuthProvider;
  avatarHue: number;
  betaUnlocked?: boolean;
}

export interface GiftItem {
  id: string;
  title: string;
  notes?: string;
  url?: string;
  price?: number;
  imageHint?: string;
  purchased: boolean;
  purchasedAt?: string;
  claimedByMe?: boolean;
  shipPreference?: ShipPreference;
}

export interface GivyList {
  id: string;
  ownerId: string;
  ownerName: string;
  title: string;
  occasion: Occasion;
  description?: string;
  eventDate: string;
  recipientAddress?: string;
  /** True on public share payloads when owner set a ship-to address (address itself never returned). */
  hasRecipientAddress?: boolean;
  /** Public tip / support link for creators (Ko-fi, Buy Me a Coffee, PayPal, etc.) */
  supportUrl?: string;
  /** Button label on the public page. Defaults to "Support me". */
  supportLabel?: string;
  shareCode: string;
  published: boolean;
  items: GiftItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Giveaway {
  id: string;
  ownerId: string;
  ownerName: string;
  title: string;
  description: string;
  itemName: string;
  area: string;
  endsAt: string;
  status: GiveawayStatus;
  entrantIds: string[];
  winnerId?: string;
  winnerName?: string;
  createdAt: string;
}

export interface ActivityEvent {
  id: string;
  type: "claim" | "publish" | "create" | "giveaway_join" | "giveaway_win";
  message: string;
  at: string;
  listId?: string;
  giveawayId?: string;
}

export const OCCASION_LABELS: Record<Occasion, string> = {
  birthday: "Birthday",
  wedding: "Wedding",
  holiday: "Holiday",
  baby: "Baby",
  graduation: "Graduation",
  creator: "Creator / content",
  other: "Just because",
};

export const OCCASION_EMOJI: Record<Occasion, string> = {
  birthday: "🎂",
  wedding: "💍",
  holiday: "🎄",
  baby: "🍼",
  graduation: "🎓",
  creator: "🎥",
  other: "✨",
};

export const DEMO_SEED_ITEMS: Omit<GiftItem, "id" | "purchased">[] = [
  {
    title: "Wool beanie",
    notes: "Something cozy for fall walks",
    url: "https://www.example.com/hat",
    price: 28,
    imageHint: "hat",
  },
  {
    title: "Fun patterned socks (3-pack)",
    notes: "Loud colors welcome",
    url: "https://www.example.com/socks",
    price: 18,
    imageHint: "socks",
  },
  {
    title: "Snack care box",
    notes: "Sweet + salty mix",
    url: "https://www.example.com/snacks",
    price: 35,
    imageHint: "snacks",
  },
  {
    title: "Everyday watch",
    notes: "Simple face, leather strap",
    url: "https://www.example.com/watch",
    price: 120,
    imageHint: "watch",
  },
  {
    title: "Gift card",
    notes: "Any bookstore or coffee shop",
    url: "https://www.example.com/giftcard",
    price: 50,
    imageHint: "card",
  },
];
