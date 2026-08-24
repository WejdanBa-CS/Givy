export function daysUntil(dateIso: string): number {
  const target = new Date(dateIso);
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatMoney(value?: number, emptyValue = ""): string {
  if (value == null || Number.isNaN(value)) return emptyValue;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatShortDate(dateIso: string): string {
  const date = new Date(dateIso.includes("T") ? dateIso : `${dateIso}T12:00:00`);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
