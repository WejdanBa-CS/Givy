"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { GiftGlyph } from "@/components/GiftGlyph";
import { formatMoney } from "@/lib/api";
import type { GiftItem } from "@/lib/types";

type Props = {
  item: GiftItem;
  actions?: ReactNode;
  footer?: ReactNode;
};

export function WishItem({ item, actions, footer }: Props) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ x: item.purchased ? 0 : 2 }}
      className={`wish-item ${item.purchased ? "is-claimed" : ""}`}
    >
      <GiftGlyph title={item.title} hint={item.imageHint} claimed={item.purchased} />
      <div className="wish-item-body">
        <div className="wish-item-top">
          <h3 className="wish-item-title">{item.title}</h3>
          {item.purchased ? (
            <span className="wish-item-status">Taken</span>
          ) : item.price != null ? (
            <span className="wish-item-price">{formatMoney(item.price)}</span>
          ) : null}
        </div>
        {item.notes && <p className="wish-item-notes">{item.notes}</p>}
        {footer}
      </div>
      {actions && <div className="wish-item-actions">{actions}</div>}
    </motion.article>
  );
}
