"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import { Countdown } from "@/components/Countdown";
import { SiteHeader } from "@/components/SiteHeader";
import { WishItem } from "@/components/WishItem";
import { useGivy } from "@/lib/givy-context";
import type { GiftItem, GivyList, ShipPreference } from "@/lib/types";
import { OCCASION_LABELS } from "@/lib/types";

function SharedGivyInner() {
  const params = useParams<{ code: string }>();
  const search = useSearchParams();
  const claimTarget = search.get("claim");
  const { ready, cloud, user, getByShare, claimItem } = useGivy();
  const [list, setList] = useState<GivyList | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<GiftItem | null>(null);
  const [ship, setShip] = useState<ShipPreference>("to_giver");
  const [doneMsg, setDoneMsg] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [revealedAddress, setRevealedAddress] = useState<string | null>(null);
  const [reopenedClaim, setReopenedClaim] = useState(false);

  useEffect(() => {
    if (!ready) return;
    void (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        setList(await getByShare(params.code));
      } catch {
        setList(null);
        setLoadError("Could not load this list. Check your connection and try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, [ready, params.code, getByShare]);

  useEffect(() => {
    if (!list || !claimTarget || reopenedClaim) return;
    const item = list.items.find((i) => i.id === claimTarget && !i.purchased);
    if (item) {
      setActiveItem(item);
      setShip("to_giver");
      setReopenedClaim(true);
    }
  }, [list, claimTarget, reopenedClaim]);

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
          <p className="font-display text-3xl text-ink">
            {loadError ? "Couldn’t open this list" : "Hmm, no Givy here"}
          </p>
          <p className="mt-2 text-sm text-ink-soft">
            {loadError ??
              "This link may be old, or the list isn’t shared yet."}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {loadError && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setLoading(true);
                  void getByShare(params.code)
                    .then((l) => {
                      setList(l);
                      setLoadError(null);
                    })
                    .catch(() =>
                      setLoadError(
                        "Could not load this list. Check your connection and try again.",
                      ),
                    )
                    .finally(() => setLoading(false));
                }}
              >
                Try again
              </button>
            )}
            <Link href="/" className="btn btn-secondary">
              Go to Givy
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const openCount = list.items.filter((i) => !i.purchased).length;
  const loginNext = `/g/${params.code}${activeItem ? `?claim=${activeItem.id}` : claimTarget ? `?claim=${claimTarget}` : ""}`;

  async function confirmClaim() {
    if (!activeItem || !list) return;
    if (cloud && !user) {
      window.location.href = `/login?next=${encodeURIComponent(loginNext)}`;
      return;
    }
    setBusy(true);
    setClaimError(null);
    try {
      const result = await claimItem(list.id, activeItem.id, ship);
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
      toast.success("Gift marked purchased");
      setList(await getByShare(params.code));
      setActiveItem(null);
    } catch (err) {
      setClaimError(
        err instanceof Error ? err.message : "Could not mark this gift",
      );
    } finally {
      setBusy(false);
    }
  }

  async function copyAddress() {
    if (!revealedAddress) return;
    try {
      await navigator.clipboard.writeText(revealedAddress);
      toast.success("Address copied");
    } catch {
      toast.error("Could not copy address");
    }
  }

  return (
    <div className="pb-20">
      <div className="friend-banner">
        Claims stay anonymous · no duplicate gifts
      </div>
      <div className="shell">
        <SiteHeader />

        <main className="mt-6 animate-rise">
          <header className="wish-hero">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="wish-hero-kicker">
                  {OCCASION_LABELS[list.occasion]} · {list.ownerName}
                </p>
                <h1 className="wish-hero-title">{list.title}</h1>
                {list.description && (
                  <p className="wish-hero-meta">{list.description}</p>
                )}
                <p className="wish-hero-meta" style={{ marginTop: "0.5rem" }}>
                  {openCount === 0
                    ? "Every gift on this list has been claimed."
                    : `${openCount} still open · claims stay anonymous`}
                </p>
              </div>
              <Countdown eventDate={list.eventDate} compact={false} />
            </div>
            {list.supportUrl && (
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <a
                  href={list.supportUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary"
                >
                  {list.supportLabel?.trim() || "Support me"}
                </a>
              </div>
            )}
          </header>

          {doneMsg && (
            <div className="mt-5 rounded-2xl border border-leaf/25 bg-leaf/10 p-4 text-sm font-semibold text-ink">
              <p>{doneMsg}</p>
              {revealedAddress && (
                <div className="mt-3 flex flex-wrap items-center gap-2 font-normal">
                  <p className="text-ink-soft">
                    Ship to:{" "}
                    <span className="font-semibold text-ink">{revealedAddress}</span>
                  </p>
                  <button
                    type="button"
                    className="btn btn-secondary !py-1.5 !px-3 text-xs"
                    onClick={() => void copyAddress()}
                  >
                    Copy address
                  </button>
                </div>
              )}
            </div>
          )}

          <ul className="wish-list stagger mt-2">
            {list.items.length === 0 && (
              <li className="py-12 text-center text-ink-soft">
                No gifts on this list yet. Check back soon.
              </li>
            )}
            {list.items.map((item) => (
              <li key={item.id}>
                <WishItem
                  item={item}
                  footer={
                    item.claimedByMe ? (
                      <p className="mt-1 text-sm font-semibold text-leaf">
                        You claimed this
                      </p>
                    ) : null
                  }
                  actions={
                    !item.purchased ? (
                      <>
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-secondary !px-3 !py-2 text-sm"
                          >
                            Buy
                          </a>
                        )}
                        <button
                          type="button"
                          className="btn btn-primary !px-3 !py-2 text-sm"
                          onClick={() => {
                            setActiveItem(item);
                            setShip("to_giver");
                            setDoneMsg(null);
                            setClaimError(null);
                            setRevealedAddress(null);
                          }}
                        >
                          Claim
                        </button>
                      </>
                    ) : undefined
                  }
                />
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

export default function SharedGivyPage() {
  return (
    <Suspense
      fallback={
        <div className="shell py-20 text-center text-ink-soft">Loading…</div>
      }
    >
      <SharedGivyInner />
    </Suspense>
  );
}
