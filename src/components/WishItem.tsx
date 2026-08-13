"use client";

import type { ReactNode } from "react";
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
    <article className={`wish-item ${item.purchased ? "is-claimed" : ""}`}>
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
    </article>
  );
}
