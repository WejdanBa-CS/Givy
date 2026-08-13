"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Countdown } from "@/components/Countdown";
import { GiftGlyph } from "@/components/GiftGlyph";
import { SiteHeader } from "@/components/SiteHeader";
import { formatMoney } from "@/lib/api";
import { useGivy } from "@/lib/givy-context";
import type { GiftItem, GivyList, ShipPreference } from "@/lib/types";
import { OCCASION_LABELS } from "@/lib/types";

export default function SharedGivyPage() {
  const params = useParams<{ code: string }>();
  const { ready, cloud, user, getByShare, claimItem } = useGivy();
  const [list, setList] = useState<GivyList | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeItem, setActiveItem] = useState<GiftItem | null>(null);
  const [ship, setShip] = useState<ShipPreference>("to_giver");
  const [doneMsg, setDoneMsg] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [revealedAddress, setRevealedAddress] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    void (async () => {
      setLoading(true);
      try {
        setList(await getByShare(params.code));
      } finally {
        setLoading(false);
      }
    })();
  }, [ready, params.code, getByShare]);

  if (!ready || loading) {
    return (
      <div className="shell py-20 text-center text-ink-soft">Loading…</div>
    );
  }

  if (!list) {
    return (
      <div className="shell pb-16">
        <SiteHeader />
        <div className="panel mx-auto mt-10 max-w-lg p-8 text-center">
          <p className="font-display text-3xl text-ink">Hmm, no Givy here</p>
          <p className="mt-2 text-sm text-ink-soft">
            {cloud
              ? "This link may be old or the list isn’t published yet."
              : "This list isn’t on this device. In demo mode, open the share link from the same browser that created it."}
          </p>
          <Link href="/" className="btn btn-primary mt-5">
            Go to Givy
          </Link>
        </div>
      </div>
    );
  }

  const openCount = list.items.filter((i) => !i.purchased).length;

  async function confirmClaim() {
    if (!activeItem || !list) return;
    if (cloud && !user) {
      window.location.href = `/login?next=/g/${params.code}`;
      return;
    }
    setBusy(true);
    setClaimError(null);
    const result = await claimItem(list.id, activeItem.id, ship);
    setBusy(false);
    if (!result.ok) {
      setClaimError(result.error ?? "Could not mark this gift");
      return;
    }
    if (ship === "to_recipient" && result.recipientAddress) {
      setRevealedAddress(result.recipientAddress);
    }
    setDoneMsg(
      ship === "to_giver"
        ? `Nice. "${activeItem.title}" is yours to wrap.`
        : `Nice. "${activeItem.title}" is marked purchased. Ship it to ${list.ownerName}.`,
    );
    setList(await getByShare(params.code));
    setActiveItem(null);
  }

  return (
    <div className="pb-20">
      <div className="friend-banner">
        Friend view: gifts you mark as purchased stay anonymous. No duplicates.
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
              {openCount} idea{openCount === 1 ? "" : "s"} still open · claimed
              gifts are crossed out (buyer stays anonymous)
            </p>
            {list.supportUrl && (
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <a
                  href={list.supportUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-primary !rounded-full !bg-amber !text-ink hover:!opacity-90"
                >
                  {list.supportLabel?.trim() || "Support me"}
                </a>
                <p className="text-sm text-ink-soft">
                  Tip {list.ownerName.split(" ")[0]} if you want. Totally optional.
                </p>
              </div>
            )}
          </div>

          {doneMsg && (
            <div className="panel mt-4 border-leaf/30 bg-leaf/10 p-4 text-sm font-semibold text-ink">
              <p>{doneMsg}</p>
              {revealedAddress && (
                <p className="mt-2 font-normal text-ink-soft">
                  Ship to:{" "}
                  <span className="font-semibold text-ink">{revealedAddress}</span>
                </p>
              )}
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
                      {item.purchased && (
                        <span className="text-sm font-semibold text-ink-soft">
                          Already purchased
                        </span>
                      )}
                      {!item.purchased && (
                        <span className="price-badge">
                          {formatMoney(item.price)}
                        </span>
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
                        setClaimError(null);
                        setRevealedAddress(null);
                      }}
                    >
                      Mark purchased
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
        </main>
      </div>

      {activeItem && (
        <div className="fixed inset-0 z-50 grid place-items-end bg-ink/35 p-4 sm:place-items-center">
          <div className="panel w-full max-w-md animate-rise border-2 p-5 sm:p-6">
            <p className="font-display text-2xl text-ink">
              Claim {activeItem.title}
            </p>
            <p className="mt-2 text-sm text-ink-soft">
              Others will see it as taken. They won&apos;t see it was you.
            </p>
            {cloud && !user && (
              <p className="mt-3 rounded-2xl bg-paper p-3 text-sm text-ink-soft">
                Sign in to mark this gift so claims stay secure across devices.
              </p>
            )}

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
                    Address is revealed only after you confirm.
                  </span>
                </span>
              </label>
            </div>

            {claimError && (
              <p className="mt-3 text-sm font-semibold text-coral-deep">
                {claimError}
              </p>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-primary"
                disabled={busy}
                onClick={() => void confirmClaim()}
              >
                {busy
                  ? "Saving…"
                  : cloud && !user
                    ? "Sign in to claim"
                    : "Confirm"}
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
