"use client";

import type { ReactNode } from "react";
import { m, useReducedMotion } from "framer-motion";
import { GiftGlyph } from "@/components/GiftGlyph";
import { formatMoney } from "@/lib/api";
import { springs } from "@/lib/motion-presets";
import { formatMinor } from "@/lib/site";
import type { GiftItem } from "@/lib/types";
import { isFunded, isGroupFund, PRIORITY_EMOJI } from "@/lib/types";

type Props = {
  item: GiftItem;
  actions?: ReactNode;
  footer?: ReactNode;
};

export function WishItem({ item, actions, footer }: Props) {
  const reduce = useReducedMotion();
  const group = isGroupFund(item);
  const funded = isFunded(item);
  const goal = item.goalMinor ?? 0;
  const raised = item.fundedMinor ?? 0;
  const pct = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;
  
  const quantityDisplay = item.quantity && item.quantityNeeded
    ? `${item.quantity}/${item.quantityNeeded}`
    : item.quantity
    ? `${item.quantity}`
    : null;

  return (
    <m.article
      layout
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduce ? { duration: 0 } : springs.soft}
      whileHover={reduce || funded ? undefined : { x: 2 }}
      whileTap={reduce || funded ? undefined : { scale: 0.995 }}
      className={`wish-item ${funded ? "is-claimed" : ""}`}
    >
      <GiftGlyph title={item.title} hint={item.imageHint} claimed={funded} />
      <div className="wish-item-body">
        <div className="wish-item-top">
          <h3 className="wish-item-title">{item.title}</h3>
          <div className="flex items-center gap-2">
            {item.priority && (
              <span className="text-xs" title={item.priority}>
                {PRIORITY_EMOJI[item.priority]}
              </span>
            )}
            {funded ? (
              <span className="wish-item-status">{group ? "Funded" : "Taken"}</span>
            ) : group && goal > 0 ? (
              <span className="wish-item-price">{formatMinor(goal)}</span>
            ) : item.price != null ? (
              <span className="wish-item-price">{formatMoney(item.price)}</span>
            ) : null}
            {quantityDisplay && (
              <span className="text-xs text-ink-soft">×{quantityDisplay}</span>
            )}
          </div>
        </div>
        {item.notes && <p className="wish-item-notes">{item.notes}</p>}
        {group && goal > 0 && (
          <div className="mt-2">
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
      </div>
      {actions && <div className="wish-item-actions">{actions}</div>}
    </m.article>
  );
}
