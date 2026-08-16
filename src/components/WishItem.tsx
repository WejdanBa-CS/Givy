"use client";

import type { ReactNode } from "react";
import { m, useReducedMotion } from "framer-motion";
import { GiftGlyph } from "@/components/GiftGlyph";
import { formatMoney } from "@/lib/api";
import { springs } from "@/lib/motion-presets";
import type { GiftItem } from "@/lib/types";
import { PRIORITY_EMOJI } from "@/lib/types";

type Props = {
  item: GiftItem;
  actions?: ReactNode;
  footer?: ReactNode;
};

export function WishItem({ item, actions, footer }: Props) {
  const reduce = useReducedMotion();
  
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
      whileHover={reduce || item.purchased ? undefined : { x: 2 }}
      whileTap={reduce || item.purchased ? undefined : { scale: 0.995 }}
      className={`wish-item ${item.purchased ? "is-claimed" : ""}`}
    >
      <GiftGlyph title={item.title} hint={item.imageHint} claimed={item.purchased} />
      <div className="wish-item-body">
        <div className="wish-item-top">
          <h3 className="wish-item-title">{item.title}</h3>
          <div className="flex items-center gap-2">
            {item.priority && (
              <span className="text-xs" title={item.priority}>
                {PRIORITY_EMOJI[item.priority]}
              </span>
            )}
            {item.purchased ? (
              <span className="wish-item-status">Taken</span>
            ) : item.price != null ? (
              <span className="wish-item-price">{formatMoney(item.price)}</span>
            ) : null}
            {quantityDisplay && (
              <span className="text-xs text-ink-soft">×{quantityDisplay}</span>
            )}
          </div>
        </div>
        {item.notes && <p className="wish-item-notes">{item.notes}</p>}
        {footer}
      </div>
      {actions && <div className="wish-item-actions">{actions}</div>}
    </m.article>
  );
}
