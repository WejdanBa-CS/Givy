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
  const quantityDisplay = item.quantity && item.quantityNeeded ? `${item.quantity}/${item.quantityNeeded}` : item.quantity ? `${item.quantity}` : null;

  return (
    <m.article
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduce ? { duration: 0 } : springs.soft}
      whileHover={reduce || funded ? undefined : { x: 2 }}
      whileTap={reduce || funded ? undefined : { scale: 0.995 }}
      className="grid grid-cols-[auto_1fr] items-start gap-4 border-b border-line py-[1.15rem] last:border-b-0 sm:grid-cols-[auto_1fr_auto] lg:gap-[1.35rem] lg:py-[1.35rem]"
    >
      <GiftGlyph title={item.title} hint={item.imageHint} claimed={funded} />
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
          <h3 className={`m-0 text-[1.1rem] font-semibold tracking-[-.02em] ${funded ? "text-ink-soft line-through decoration-[1.5px]" : "text-ink"}`}>{item.title}</h3>
          <div className="flex items-center gap-2">
            {item.priority && <span className="text-xs" title={item.priority}>{PRIORITY_EMOJI[item.priority]}</span>}
            {funded ? <span className="text-xs font-bold uppercase tracking-[.06em] text-ink-soft">{group ? "Funded" : "Taken"}</span> : group && goal > 0 ? <span className="text-[.95rem] font-bold tracking-[-.02em] text-ink">{formatMinor(goal)}</span> : item.price != null ? <span className="text-[.95rem] font-bold tracking-[-.02em] text-ink">{formatMoney(item.price)}</span> : null}
            {quantityDisplay && <span className="text-xs text-ink-soft">×{quantityDisplay}</span>}
          </div>
        </div>
        {item.notes && <p className="mt-1.5 text-[.9rem] leading-[1.45] text-ink-soft">{item.notes}</p>}
        {group && goal > 0 && <div className="mt-2"><div className="h-1.5 overflow-hidden rounded-full bg-mist-deep" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><div className="h-full rounded-full bg-coral" style={{ width: `${pct}%` }} /></div><p className="mt-1 text-xs font-semibold text-ink-soft">{formatMinor(raised)} of {formatMinor(goal)} pledged{item.contributorCount ? ` · ${item.contributorCount}` : ""}</p></div>}
        {footer}
      </div>
      {actions && <div className="col-start-2 flex flex-wrap items-center gap-1.5 sm:col-auto sm:flex-col sm:items-end">{actions}</div>}
    </m.article>
  );
}
