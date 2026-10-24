"use client";

import type { ReactNode } from "react";
import { m, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { GiftGlyph } from "@/components/GiftGlyph";
import { formatMoney } from "@/lib/api";
import { springs } from "@/lib/motion-presets";
import { formatMinor } from "@/lib/site";
import type { GiftItem } from "@/lib/types";
import { isFunded, isGroupFund } from "@/lib/types";

type Props = { item: GiftItem; actions?: ReactNode; footer?: ReactNode };

export function WishItem({ item, actions, footer }: Props) {
  const reduce = useReducedMotion();
  const group = isGroupFund(item);
  const funded = isFunded(item);
  const goal = item.goalMinor ?? 0;
  const raised = item.fundedMinor ?? 0;
  const pct = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;
  const quantityDisplay =
    item.quantity && item.quantityNeeded
      ? `${item.quantity}/${item.quantityNeeded}`
      : item.quantity
        ? `${item.quantity}`
        : null;
  const priceLabel =
    group && goal > 0
      ? formatMinor(goal)
      : item.price != null
        ? formatMoney(item.price)
        : null;

  return (
    <m.article
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduce ? { duration: 0 } : springs.soft}
      whileHover={reduce || funded ? undefined : { y: -2 }}
      whileTap={reduce || funded ? undefined : { scale: 0.995 }}
      className={`relative overflow-hidden rounded-2xl border bg-paper shadow-[var(--shadow-card)] transition-shadow duration-300 ${funded ? "border-leaf/25" : "border-line/80 hover:shadow-[var(--shadow-raised)]"}`}
    >
      <div className="relative overflow-hidden">
        <GiftGlyph title={item.title} hint={item.imageHint} claimed={funded} size="card" />
        {funded && (
          <span className="absolute right-2.5 top-2.5 inline-flex h-6 items-center gap-1 rounded-full bg-leaf pl-2 pr-2.5 text-[11px] font-semibold tracking-[0.02em] text-white shadow-sm">
            <Check aria-hidden size={12} strokeWidth={2.5} />
            {group ? "Funded" : "Claimed"}
          </span>
        )}
        {item.priority === "high" && !funded && (
          <span className="absolute left-2.5 top-2.5 inline-flex h-6 items-center rounded-full bg-ink px-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-mist">
            Most wanted
          </span>
        )}
        {priceLabel && !funded && (
          <span className="absolute right-2.5 top-2.5 inline-flex h-7 items-center rounded-lg border border-line/80 bg-paper/90 px-2 font-display text-[15px] font-semibold tabular-nums text-ink shadow-[0_1px_2px_rgba(28,17,8,.06)] backdrop-blur-sm">
            {priceLabel}
          </span>
        )}
      </div>

      <div className="p-3.5">
        <h3
          className={`mb-1 font-display text-[15px] font-semibold leading-snug tracking-[-0.01em] ${funded ? "text-ink-soft" : "text-ink"}`}
        >
          {item.title}
        </h3>
        {item.notes && (
          <p className="mb-3 text-xs text-ink-soft line-clamp-2">{item.notes}</p>
        )}
        {quantityDisplay && (
          <p className="mb-2 text-xs font-semibold text-ink-soft">×{quantityDisplay}</p>
        )}
        {group && goal > 0 && (
          <div className="mb-3">
            <div
              className="h-1.5 overflow-hidden rounded-full bg-mist-deep"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="h-full rounded-full bg-coral" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-1 text-xs font-semibold text-ink-soft">
              {formatMinor(raised)} of {formatMinor(goal)} pledged
              {item.contributorCount ? ` · ${item.contributorCount}` : ""}
            </p>
          </div>
        )}
        {footer}
        {actions ? (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">{actions}</div>
        ) : !funded ? (
          <div className="mt-1 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-line" />
            <span className="text-xs font-semibold text-ink-soft">Available</span>
          </div>
        ) : (
          <div className="mt-1 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-leaf-soft" />
            <span className="text-xs font-semibold text-leaf">
              {group ? "Funded" : "Claimed"}
            </span>
          </div>
        )}
      </div>
    </m.article>
  );
}
