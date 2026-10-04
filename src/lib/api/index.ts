export * from "./auth";
export * from "./items";
export * from "./lists";
export * from "./mappers";
export * from "./notifications";
export * from "./friends";
export * from "./events";
export * from "./event-notifications";
export * from "./friend-lists";

import { formatMoney as formatMoneyValue } from "../utils/format";

/** Preserve the prior API presentation fallback for gift prices. */
export function formatMoney(value?: number): string {
  return formatMoneyValue(value, "-");
}
