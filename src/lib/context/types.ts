import type { ClaimResult, EmailAuthResult, PledgeResult } from "@/lib/api";
import type {
  ActivityEvent,
  AuthProvider,
  GiftItem,
  Giveaway,
  GivyList,
  ShipPreference,
  User,
} from "@/lib/types";

export type AuthContextValue = {
  ready: boolean;
  cloud: boolean;
  localSession: boolean;
  user: User | null;
  refresh: () => Promise<void>;
  signIn: (provider: AuthProvider, next?: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    password: string,
    displayName?: string,
  ) => Promise<EmailAuthResult>;
  signOut: () => Promise<void>;
};

export type ListContextValue = {
  /** Refresh list, giveaway, and activity data for the active session. */
  refresh: () => Promise<void>;
  lists: GivyList[];
  giveaways: Giveaway[];
  activity: ActivityEvent[];
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
  publishList: (listId: string) => Promise<GivyList | null>;
  duplicateList: (
    sourceListId: string,
    newTitle?: string,
    newEventDate?: string,
  ) => Promise<GivyList | null>;
  searchLists: (query: string) => GivyList[];
  filterListsByTag: (tag: string) => GivyList[];
  getAllTags: () => string[];
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

export type ItemActions = {
  addItem: (
    listId: string,
    item: Omit<GiftItem, "id" | "purchased" | "purchasedAt" | "claimedByMe">,
  ) => Promise<GiftItem | null>;
  updateItem: (
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
  ) => Promise<GiftItem | null>;
  removeItem: (listId: string, itemId: string) => Promise<void>;
  claimItem: (
    listId: string,
    itemId: string,
    shipPreference: ShipPreference,
  ) => Promise<ClaimResult>;
  pledgeContribution: (input: {
    listId: string;
    itemId: string;
    amountMinor: number;
    giverName?: string;
    message?: string;
    anonymous?: boolean;
  }) => Promise<PledgeResult>;
};

export type GivyContextValue = AuthContextValue & ListContextValue & ItemActions;
