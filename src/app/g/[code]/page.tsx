"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Countdown } from "@/components/Countdown";
import { GiftGlyph } from "@/components/GiftGlyph";
import { SiteHeader } from "@/components/SiteHeader";
import { useGivy } from "@/lib/givy-context";
import { formatMoney } from "@/lib/store";
import type { GiftItem, GivyList, ShipPreference } from "@/lib/types";
import { OCCASION_LABELS } from "@/lib/types";

export default function SharedGivyPage() {
  const params = useParams<{ code: string }>();
  const { ready, getByShare, claimItem, refresh } = useGivy();
  const [list, setList] = useState<GivyList | null>(null);
  const [activeItem, setActiveItem] = useState<GiftItem | null>(null);
  const [ship, setShip] = useState<ShipPreference>("to_giver");
  const [doneMsg, setDoneMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    setList(getByShare(params.code));
  }, [ready, params.code, getByShare]);

  if (!ready) {
    return <div className="shell py-20 text-center text-ink-soft">Loading…</div>;
  }

  if (!list) {
    return (
      <div className="shell pb-16">
        <SiteHeader />
        <div className="panel mx-auto mt-10 max-w-lg p-8 text-center">
          <p className="font-display text-3xl text-ink">Hmm, no Givy here</p>
          <p className="mt-2 text-sm text-ink-soft">
            This link may be old, or the list hasn&apos;t been created on this device yet
            (MVP stores lists in local browser storage).
          </p>
          <Link href="/" className="btn btn-primary mt-5">
            Go to Givy
          </Link>
        </div>
      </div>
    );
  }

  const openCount = list.items.filter((i) => !i.purchased).length;

  function confirmClaim() {
    if (!activeItem || !list) return;
    const updated = claimItem(list.id, activeItem.id, ship);
    if (updated) {
      setList(updated);
      refresh();
      setDoneMsg(
        ship === "to_giver"
          ? `Nice — "${activeItem.title}" is yours to wrap. Ship it to your place.`
          : `Nice — "${activeItem.title}" is marked claimed. Ship it to ${list.ownerName}.`,
      );
    }
    setActiveItem(null);
  }

  return (
    <div className="pb-20">
      <div className="friend-banner">
        🤫 Friend view — gifts you claim stay anonymous. No duplicates, no spoilers.
      </div>
      <div className="shell">
        <SiteHeader />

        <main className="mt-6">
          <div className="panel animate-rise p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-leaf">
                  {OCCASION_LABELS[list.occasion]} · {list.ownerName}
                </p>
                <h1 className="mt-2 font-display text-4xl tracking-tight text-ink sm:text-5xl">
                  {list.title}
                </h1>
                {list.description && (
                  <p className="mt-3 max-w-xl text-ink-soft">{list.description}</p>
                )}
              </div>
              <Countdown eventDate={list.eventDate} compact={false} />
            </div>
            <p className="mt-5 text-sm font-semibold text-ink-soft">
              {openCount} idea{openCount === 1 ? "" : "s"} still open · claimed gifts are
              crossed out (buyer stays anonymous)
            </p>
          </div>

        {doneMsg && (
          <div className="panel mt-4 border-leaf/30 bg-leaf/10 p-4 text-sm font-semibold text-ink">
            {doneMsg}
          </div>
        )}

        <ul className="stagger mt-6 space-y-3">
          {list.items.map((item) => (
            <li
              key={item.id}
              className={`panel flex flex-col gap-4 p-4 sm:flex-row sm:items-center ${
                item.purchased ? "gift-claimed" : ""
              }`}
            >
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <GiftGlyph hint={item.imageHint} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <p className="gift-title text-lg font-semibold text-ink">
                      {item.title}
                    </p>
                    <span className="text-sm font-semibold text-ink-soft">
                      {item.purchased ? "Already claimed" : null}
                    </span>
                    {!item.purchased && (
                      <span className="price-badge">{formatMoney(item.price)}</span>
                    )}
                  </div>
                  {item.notes && (
                    <p className="mt-1 text-sm text-ink-soft">{item.notes}</p>
                  )}
                </div>
              </div>

              {!item.purchased ? (
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary"
                    >
                      Buy link
                    </a>
                  )}
                  <button
                    type="button"
                    className="btn btn-primary !rounded-full"
                    onClick={() => {
                      setActiveItem(item);
                      setShip("to_giver");
                      setDoneMsg(null);
                    }}
                  >
                    Claim this gift 🎁
                  </button>
                </div>
              ) : (
                <span className="text-sm font-semibold text-ink-soft sm:ml-auto">
                  {item.claimedByMe ? "You claimed this" : "Taken"}
                </span>
              )}
            </li>
          ))}
        </ul>

        <aside className="panel mt-6 flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-ink">
              Sponsored
            </p>
            <p className="font-semibold text-ink">
              Pair any gift with a handwritten note kit — 15% off this week.
            </p>
          </div>
          <button type="button" className="btn btn-secondary shrink-0">
            View offer
          </button>
        </aside>
      </main>
      </div>

      {activeItem && (
        <div className="fixed inset-0 z-50 grid place-items-end bg-ink/35 p-4 sm:place-items-center">
          <div className="panel w-full max-w-md animate-rise border-2 p-5 sm:p-6">
            <p className="font-display text-2xl text-ink">Claim {activeItem.title}</p>
            <p className="mt-2 text-sm text-ink-soft">
              Others will see it as taken — they won&apos;t see it was you.
            </p>

            <div className="mt-5 space-y-2">
              <label className="flex cursor-pointer gap-3 rounded-2xl border-2 border-line bg-paper p-3">
                <input
                  type="radio"
                  name="ship"
                  checked={ship === "to_giver"}
                  onChange={() => setShip("to_giver")}
                />
                <span>
                  <span className="block font-semibold">Ship to me</span>
                  <span className="block text-sm text-ink-soft">
                    Wrap it and give it in person.
                  </span>
                </span>
              </label>
              <label className="flex cursor-pointer gap-3 rounded-2xl border-2 border-line bg-paper p-3">
                <input
                  type="radio"
                  name="ship"
                  checked={ship === "to_recipient"}
                  onChange={() => setShip("to_recipient")}
                />
                <span>
                  <span className="block font-semibold">
                    Ship to {list.ownerName}
                  </span>
                  <span className="block text-sm text-ink-soft">
                    {list.recipientAddress
                      ? list.recipientAddress
                      : "They haven’t added an address yet — you can still claim and ask them."}
                  </span>
                </span>
              </label>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button type="button" className="btn btn-primary" onClick={confirmClaim}>
                Confirm claim
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setActiveItem(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
