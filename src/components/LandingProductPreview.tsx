"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { GiftGlyph } from "@/components/GiftGlyph";
import { FadeIn } from "@/components/motion";
import type { GiftItem } from "@/lib/types";

const demoItems: GiftItem[] = [
  {
    id: "demo-tote",
    title: "Soft leather tote",
    notes: "Everyday bag in warm tan.",
    price: 89,
    purchased: true,
  },
  {
    id: "demo-pour",
    title: "Ceramic pour-over",
    notes: "For slow weekend coffee.",
    price: 42,
    purchased: false,
  },
  {
    id: "demo-stay",
    title: "Weekend cabin stay",
    notes: "Two nights, anywhere quiet.",
    price: 180,
    purchased: false,
    fundingMode: "cash_fund",
    goalMinor: 18000,
    fundedMinor: 4500,
    contributorCount: 2,
  },
];

type View = "owner" | "guest";

export function LandingProductPreview() {
  const [view, setView] = useState<View>("guest");
  const guestTab = useRef<HTMLButtonElement>(null);
  const ownerTab = useRef<HTMLButtonElement>(null);
  const openCount = demoItems.filter((item) => !item.purchased).length;

  function selectView(next: View) {
    setView(next);
    queueMicrotask(() => {
      (next === "guest" ? guestTab : ownerTab).current?.focus();
    });
  }

  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (
      event.key !== "ArrowRight" &&
      event.key !== "ArrowLeft" &&
      event.key !== "Home" &&
      event.key !== "End"
    ) {
      return;
    }
    event.preventDefault();
    if (event.key === "Home") {
      selectView("guest");
      return;
    }
    if (event.key === "End") {
      selectView("owner");
      return;
    }
    selectView(view === "guest" ? "owner" : "guest");
  }

  return (
    <section id="preview" className="landing-section shell" aria-labelledby="preview-heading">
      <FadeIn>
        <p className="landing-kicker">The list</p>
        <h2 id="preview-heading" className="font-display text-3xl tracking-tight sm:text-4xl lg:text-5xl">
          See Givy before you start.
        </h2>
        <p className="mt-3 max-w-lg text-ink-soft lg:max-w-xl lg:text-lg">
          One shared list. Guests claim in private. You only see what is taken — never who bought it.
        </p>
      </FadeIn>

      <FadeIn delay={0.12} className="landing-preview-frame">
        <div className="landing-preview-toolbar" role="tablist" aria-label="Wishlist preview">
          <button
            type="button"
            role="tab"
            id="preview-tab-guest"
            ref={guestTab}
            aria-controls="preview-panel"
            aria-selected={view === "guest"}
            tabIndex={view === "guest" ? 0 : -1}
            className={`landing-view-btn ${view === "guest" ? "is-active" : ""}`}
            onClick={() => setView("guest")}
            onKeyDown={onTabKeyDown}
          >
            Guest view
          </button>
          <button
            type="button"
            role="tab"
            id="preview-tab-owner"
            ref={ownerTab}
            aria-controls="preview-panel"
            aria-selected={view === "owner"}
            tabIndex={view === "owner" ? 0 : -1}
            className={`landing-view-btn ${view === "owner" ? "is-active" : ""}`}
            onClick={() => setView("owner")}
            onKeyDown={onTabKeyDown}
          >
            Your view
          </button>
        </div>

        <div
          id="preview-panel"
          role="tabpanel"
          aria-labelledby={view === "guest" ? "preview-tab-guest" : "preview-tab-owner"}
          className="landing-preview-body"
        >
          {view === "guest" && (
            <p className="landing-preview-banner">
              Claims stay anonymous · no duplicate gifts
            </p>
          )}

          <header className="wish-hero landing-preview-hero">
            <p className="wish-hero-kicker">Birthday · Maya</p>
            <h3 className="wish-hero-title">Maya’s birthday</h3>
            <p className="wish-hero-meta">
              {view === "guest"
                ? `${openCount} still open · claims stay anonymous`
                : `${openCount} still open · taken gifts never show a name`}
            </p>
          </header>

          <ul className="wish-list">
            {demoItems.map((item) => (
              <li key={item.id}>
                <article className={`wish-item ${item.purchased ? "is-claimed" : ""}`}>
                  <GiftGlyph title={item.title} claimed={item.purchased} />
                  <div className="wish-item-body">
                    <div className="wish-item-top">
                      <h4 className="wish-item-title">{item.title}</h4>
                      {item.purchased ? (
                        <span className="wish-item-status">Taken</span>
                      ) : (
                        <span className="wish-item-price">${item.price}</span>
                      )}
                    </div>
                    {item.notes && <p className="wish-item-notes">{item.notes}</p>}
                    {view === "owner" && item.purchased && (
                      <p className="landing-preview-note">Taken — you won’t see who claimed it.</p>
                    )}
                  </div>
                  {view === "guest" && !item.purchased && (
                    <div className="wish-item-actions" aria-hidden>
                      <span className="landing-preview-claim">
                        {item.fundingMode === "cash_fund"
                          ? "Contribute now"
                          : "I’ll get this"}
                      </span>
                    </div>
                  )}
                </article>
              </li>
            ))}
          </ul>
        </div>
      </FadeIn>
    </section>
  );
}
