export * from "./auth";
export * from "./items";
export * from "./lists";
export * from "./mappers";
export * from "./notifications";

import { formatMoney as formatMoneyValue } from "../utils/format";

/** Preserve the prior API presentation fallback for gift prices. */
export function formatMoney(value?: number): string {
  return formatMoneyValue(value, "-");
}
