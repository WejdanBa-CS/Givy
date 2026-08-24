"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { GiftGlyph } from "@/components/GiftGlyph";
import { FadeIn } from "@/components/motion";
import type { GiftItem } from "@/lib/types";

const demoItems: GiftItem[] = [
  { id: "demo-tote", title: "Soft leather tote", notes: "Everyday bag in warm tan.", price: 89, purchased: true },
  { id: "demo-pour", title: "Ceramic pour-over", notes: "For slow weekend coffee.", price: 42, purchased: false },
  { id: "demo-stay", title: "Weekend cabin stay", notes: "Two nights, anywhere quiet.", price: 180, purchased: false, fundingMode: "cash_fund", goalMinor: 18000, fundedMinor: 4500, contributorCount: 2 },
];

type View = "owner" | "guest";
const kickerClass = "m-0 text-xs font-extrabold uppercase tracking-[0.14em] text-leaf";

export function LandingProductPreview() {
  const [view, setView] = useState<View>("guest");
  const guestTab = useRef<HTMLButtonElement>(null);
  const ownerTab = useRef<HTMLButtonElement>(null);
  const openCount = demoItems.filter((item) => !item.purchased).length;

  function selectView(next: View) {
    setView(next);
    queueMicrotask(() => (next === "guest" ? guestTab : ownerTab).current?.focus());
  }

  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    if (event.key === "Home") return selectView("guest");
    if (event.key === "End") return selectView("owner");
    selectView(view === "guest" ? "owner" : "guest");
  }

  const viewClass = (active: boolean) =>
    `min-h-11 flex-1 rounded-[.875rem] border-0 px-3.5 py-2.5 font-bold transition ${active ? "bg-paper text-ink shadow-[0_1px_0_var(--line)]" : "bg-transparent text-ink-soft hover:text-ink"}`;

  return (
    <section id="preview" className="shell py-[clamp(3.5rem,8vw,5.5rem)] lg:py-[clamp(4.5rem,9vw,6.5rem)]" aria-labelledby="preview-heading">
      <FadeIn>
        <p className={kickerClass}>The list</p>
        <h2 id="preview-heading" className="font-display text-3xl tracking-tight sm:text-4xl lg:text-5xl">See Givy before you start.</h2>
        <p className="mt-3 max-w-lg text-ink-soft lg:max-w-xl lg:text-lg">One shared list. Guests claim in private. You only see what is taken — never who bought it.</p>
      </FadeIn>

      <FadeIn delay={0.12} className="mt-8 overflow-hidden rounded-2xl border-2 border-line bg-paper lg:mx-auto lg:mt-10 lg:max-w-[42rem]">
        <div className="flex gap-1 border-b border-line bg-mist p-3" role="tablist" aria-label="Wishlist preview">
          <button type="button" role="tab" id="preview-tab-guest" ref={guestTab} aria-controls="preview-panel" aria-selected={view === "guest"} tabIndex={view === "guest" ? 0 : -1} className={viewClass(view === "guest")} onClick={() => setView("guest")} onKeyDown={onTabKeyDown}>Guest view</button>
          <button type="button" role="tab" id="preview-tab-owner" ref={ownerTab} aria-controls="preview-panel" aria-selected={view === "owner"} tabIndex={view === "owner" ? 0 : -1} className={viewClass(view === "owner")} onClick={() => setView("owner")} onKeyDown={onTabKeyDown}>Your view</button>
        </div>

        <div id="preview-panel" role="tabpanel" aria-labelledby={view === "guest" ? "preview-tab-guest" : "preview-tab-owner"} className="px-[.9rem] pb-[.2rem] pt-[.95rem] sm:px-[1.15rem] sm:pb-[.35rem] sm:pt-[1.15rem] lg:px-6 lg:pb-2 lg:pt-6">
          {view === "guest" && <p className="mb-4 rounded-[.9rem] bg-leaf/10 px-3.5 py-2.5 text-center text-[.82rem] font-bold tracking-[.02em] text-leaf">Claims stay anonymous · no duplicate gifts</p>}
          <header className="wish-hero pt-0.5">
            <p className="wish-hero-kicker">Birthday · Maya</p>
            <h3 className="wish-hero-title text-[clamp(1.65rem,4vw,2.15rem)]">Maya’s birthday</h3>
            <p className="wish-hero-meta">{view === "guest" ? `${openCount} still open · claims stay anonymous` : `${openCount} still open · taken gifts never show a name`}</p>
          </header>
          <ul className="wish-list">
            {demoItems.map((item) => (
              <li key={item.id}>
                <article className={`wish-item ${item.purchased ? "is-claimed" : ""}`}>
                  <GiftGlyph title={item.title} claimed={item.purchased} />
                  <div className="wish-item-body"><div className="wish-item-top"><h4 className="wish-item-title">{item.title}</h4>{item.purchased ? <span className="wish-item-status">Taken</span> : <span className="wish-item-price">${item.price}</span>}</div>{item.notes && <p className="wish-item-notes">{item.notes}</p>}{view === "owner" && item.purchased && <p className="mt-1 text-[.82rem] font-semibold text-leaf">Taken — you won’t see who claimed it.</p>}</div>
                  {view === "guest" && !item.purchased && <div className="wish-item-actions" aria-hidden><span className="inline-flex min-h-10 items-center justify-center whitespace-nowrap rounded-[.875rem] bg-coral px-3 py-2 text-sm font-bold text-white">{item.fundingMode === "cash_fund" ? "Contribute now" : "I’ll get this"}</span></div>}
                </article>
              </li>
            ))}
          </ul>
        </div>
      </FadeIn>
    </section>
  );
}
