export * from "./storage";
export * from "./local-auth";
export * from "./local-lists";
export * from "./local-items";
export {
  createGiveaway,
  getGiveawayById,
  getGiveaways,
  joinGiveaway,
  saveGiveaways,
} from "./local-giveaways";
export { ensureSeedData } from "./seed";
export { daysUntil, formatMoney, formatShortDate } from "../utils/format";

import { getCurrentUser } from "./local-auth";
import { drawGiveawayLocal } from "./local-giveaways";

/** Compatibility wrapper preserving the original browser-demo API. */
export function drawGiveaway(giveawayId: string, ownerId: string) {
  return drawGiveawayLocal(giveawayId, ownerId, getCurrentUser());
}
