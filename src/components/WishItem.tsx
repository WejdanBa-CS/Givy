"use client";

import type { ReactNode } from "react";
import { m, useReducedMotion } from "framer-motion";
import { GiftGlyph } from "@/components/GiftGlyph";
import { formatMoney } from "@/lib/api";
import { springs } from "@/lib/motion-presets";
import { formatMinor } from "@/lib/site";
import type { GiftItem } from "@/lib/types";
import { isFunded, isGroupFund, PRIORITY_EMOJI } from "@/lib/types";

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
      className={`relative overflow-hidden rounded-2xl border-2 border-line bg-paper transition-shadow ${funded ? "opacity-60" : "hover:shadow-md"}`}
    >
      {funded && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center backdrop-blur-[2px]"
          style={{ background: "rgba(254,246,238,0.75)" }}
        >
          <div className="flex flex-col items-center gap-1 rounded-2xl border border-line bg-paper px-4 py-2.5 shadow-sm">
            <span className="text-lg leading-none text-leaf-soft" aria-hidden>
              ✓
            </span>
            <span className="text-xs font-black text-ink">
              {group ? "Funded" : "Claimed"}
            </span>
          </div>
        </div>
      )}

      <div className="relative overflow-hidden">
        <GiftGlyph title={item.title} hint={item.imageHint} claimed={funded} size="card" />
        {item.priority && (
          <span
            className="absolute left-2.5 top-2.5 rounded-xl bg-paper/90 px-1.5 py-0.5 text-lg shadow-sm"
            title={item.priority}
          >
            {PRIORITY_EMOJI[item.priority]}
          </span>
        )}
        {priceLabel && (
          <span className="absolute bottom-2.5 right-2.5 rounded-xl bg-amber px-2 py-1 text-xs font-black text-ink">
            {priceLabel}
          </span>
        )}
      </div>

      <div className="p-3.5">
        <h3
          className={`mb-1 font-display text-sm font-black leading-tight ${funded ? "text-ink-soft line-through" : "text-ink"}`}
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
