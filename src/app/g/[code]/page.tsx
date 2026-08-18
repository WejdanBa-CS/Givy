"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ContributeSheet } from "@/components/ContributeSheet";
import { Countdown } from "@/components/Countdown";
import { FriendListConfirm } from "@/components/FriendListConfirm";
import { GiftUnwrapCelebration } from "@/components/GiftUnwrapCelebration";
import { SiteHeader } from "@/components/SiteHeader";
import { WishItem } from "@/components/WishItem";
import { SupportPayPanel } from "@/components/SupportPayPanel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useGivy } from "@/lib/givy-context";
import { safeHttpUrl, shopHref } from "@/lib/security";
import type { GiftItem, GivyList, ShipPreference } from "@/lib/types";
import { isFunded, isGroupFund, OCCASION_LABELS } from "@/lib/types";

function SharedGivyInner() {
  const params = useParams<{ code: string }>();
  const search = useSearchParams();
  const claimTarget = search.get("claim");
  const { ready, cloud, user, getByShare, claimItem, pledgeContribution } = useGivy();
  const [list, setList] = useState<GivyList | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<GiftItem | null>(null);
  const [fundItem, setFundItem] = useState<GiftItem | null>(null);
  const [ship, setShip] = useState<ShipPreference>("to_giver");
  const [doneMsg, setDoneMsg] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [revealedAddress, setRevealedAddress] = useState<string | null>(null);
  const [reopenedClaim, setReopenedClaim] = useState(false);
  const [unwrapTitle, setUnwrapTitle] = useState<string | null>(null);
  const [friendConfirmed, setFriendConfirmed] = useState(false);

  const clearUnwrap = useCallback(() => setUnwrapTitle(null), []);
  const markFriendConfirmed = useCallback(() => setFriendConfirmed(true), []);

  const reloadList = useCallback(
    async (opts?: { quiet?: boolean }) => {
      if (!ready) return;
      if (!opts?.quiet) {
        setLoading(true);
        setLoadError(null);
      }
      try {
        setList(await getByShare(params.code));
        setLoadError(null);
      } catch {
        if (!opts?.quiet) {
          setList(null);
          setLoadError(
            "Could not load this list. Check your connection and try again.",
          );
        }
      } finally {
        if (!opts?.quiet) setLoading(false);
      }
    },
    [ready, params.code, getByShare],
  );

  useEffect(() => {
    void reloadList();
  }, [reloadList]);

  // Keep claimed state fresh for other shoppers / when returning to the tab.
  useEffect(() => {
    if (!ready || !list) return;
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void reloadList({ quiet: true });
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    const poll = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void reloadList({ quiet: true });
      }
    }, 12_000);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      window.clearInterval(poll);
    };
  }, [ready, list?.id, reloadList]);

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
                onClick={() => void reloadList()}
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
  const activeBuyUrl = activeItem ? safeHttpUrl(activeItem.url) : null;

  async function confirmClaim() {
    if (!activeItem || !list) return;
    if (user && !friendConfirmed) {
      setClaimError("Confirm this is your friend’s list first.");
      return;
    }
    if (cloud && !user) {
      window.location.href = `/login?next=${encodeURIComponent(loginNext)}`;
      return;
    }
    if (ship === "to_recipient" && !list.hasRecipientAddress) {
      setClaimError(
        "Owner hasn’t added a ship-to address. Choose “Ship to me” instead.",
      );
      return;
    }
    setBusy(true);
    setClaimError(null);
    try {
      const result = await claimItem(list.id, activeItem.id, ship);
      if (!result.ok) {
        const raw = (result.error ?? "").toLowerCase();
        if (raw.includes("too many claims")) {
          setClaimError("Too many claims right now. Try again in a bit.");
        } else if (raw.includes("already") || raw.includes("claimed")) {
          setClaimError("Someone just claimed this gift. Pick another.");
          void reloadList({ quiet: true });
        } else if (raw.includes("sign in")) {
          setClaimError("Sign in to claim this gift.");
        } else {
          setClaimError(result.error ?? "Could not mark this gift");
        }
        return;
      }
      if (ship === "to_recipient" && result.recipientAddress) {
        setRevealedAddress(result.recipientAddress);
      }
      const claimedTitle = activeItem.title;
      const claimedId = activeItem.id;
      // Optimistic mark so the list updates even if refetch is slow.
      setList((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.map((i) =>
                i.id === claimedId
                  ? {
                      ...i,
                      purchased: true,
                      purchasedAt: new Date().toISOString(),
                      claimedByMe: true,
                    }
                  : i,
              ),
            }
          : prev,
      );
      setDoneMsg(
        ship === "to_giver"
          ? `Nice. "${claimedTitle}" is yours to wrap.`
          : `Nice. "${claimedTitle}" is marked purchased. Ship it to ${list.ownerName}.`,
      );
      toast.success("Marked as taken on this list", {
        description:
          ship === "to_giver"
            ? `"${claimedTitle}" is reserved. Wrap it and give it in person.`
            : `"${claimedTitle}" is reserved. Ship it to ${list.ownerName}.`,
      });
      try {
        setUnwrapTitle(claimedTitle);
      } catch {
        /* ignore */
      }
      setActiveItem(null);
      void reloadList({ quiet: true });
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
      {user && list && (
        <FriendListConfirm
          shareCode={params.code}
          ownerName={list.ownerName}
          listTitle={list.title}
          signedInAs={user.name}
          confirmed={friendConfirmed}
          onConfirmed={markFriendConfirmed}
        />
      )}
      <div className="friend-banner">
        Ensure you received this link directly from the gift receiver.
      </div>
      <div className="shell">
        <SiteHeader />

        <main className="mt-6 animate-rise lg:mt-8">
          <header className="wish-hero">
            <div className="flex flex-wrap items-start justify-between gap-4 lg:gap-8">
              <div className="min-w-0 flex-1">
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
              <SupportPayPanel
                supportUrl={list.supportUrl}
                supportLabel={list.supportLabel}
                ownerName={list.ownerName}
              />
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
            {list.items.map((item) => {
              const group = isGroupFund(item);
              const funded = isFunded(item);
              const buyHref = shopHref(item);
              return (
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
                    !funded ? (
                      <>
                        {group ? (
                          <Button
                            size="sm"
                            onClick={() => {
                              if (user && !friendConfirmed) {
                                toast.message("Confirm the list owner first", {
                                  description:
                                    "Make sure this is your friend’s wishlist before contributing.",
                                });
                                return;
                              }
                              setFundItem(item);
                            }}
                          >
                            Contribute now
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => {
                              if (user && !friendConfirmed) {
                                toast.message("Confirm the list owner first", {
                                  description:
                                    "Make sure this is your friend’s wishlist before reserving a gift.",
                                });
                                return;
                              }
                              setActiveItem(item);
                              setShip("to_giver");
                              setDoneMsg(null);
                              setClaimError(null);
                              setRevealedAddress(null);
                            }}
                          >
                            I&apos;ll get this
                          </Button>
                        )}
                        {buyHref && (
                          <Button asChild variant="secondary" size="sm">
                            <a
                              href={buyHref}
                              rel="noopener noreferrer"
                              {...(buyHref.startsWith("http")
                                ? { target: "_blank" }
                                : {})}
                            >
                              {group ? "Buy from retailer" : "Shop link"}
                            </a>
                          </Button>
                        )}
                      </>
                    ) : undefined
                  }
                />
              </li>
              );
            })}
          </ul>
          <p className="mt-8 mb-4 text-center text-sm text-ink-soft">
            Ensure you received this link directly from the gift receiver.
          </p>
        </main>
      </div>

      <ContributeSheet
        item={fundItem}
        ownerName={list.ownerName}
        onClose={() => setFundItem(null)}
        onPledge={async (input) => {
          if (!fundItem) return;
          const result = await pledgeContribution({
            listId: list.id,
            itemId: fundItem.id,
            ...input,
          });
          toast.success("Pledge recorded");
          setFundItem(null);
          setList((prev) =>
            prev
              ? {
                  ...prev,
                  items: prev.items.map((it) =>
                    it.id === fundItem.id
                      ? {
                          ...it,
                          fundedMinor: result.fundedMinor,
                          goalMinor: result.targetMinor,
                          campaignState:
                            result.state === "funded" ||
                            result.state === "open" ||
                            result.state === "closed" ||
                            result.state === "paid_out"
                              ? result.state
                              : it.campaignState,
                          contributorCount: result.contributorCount,
                        }
                      : it,
                  ),
                }
              : prev,
          );
        }}
      />

      <GiftUnwrapCelebration
        open={Boolean(unwrapTitle)}
        giftTitle={unwrapTitle ?? undefined}
        onComplete={clearUnwrap}
      />

      <Dialog
        open={Boolean(activeItem)}
        onOpenChange={(open) => {
          if (!open) setActiveItem(null);
        }}
      >
        <DialogContent>
          {activeItem && (
            <>
              <DialogHeader>
                <DialogTitle>I&apos;ll get {activeItem.title}</DialogTitle>
                <DialogDescription>
                  This marks it <strong>Taken</strong> on the list so nobody else
                  buys the same gift. They won&apos;t see it was you.
                </DialogDescription>
              </DialogHeader>
              {activeBuyUrl && (
                <a
                  href={activeBuyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary mt-3 inline-flex w-full justify-center"
                >
                  Open shop link
                </a>
              )}
              {cloud && !user && (
                <p className="mt-3 rounded-2xl bg-mist p-3 text-sm text-ink-soft">
                  Sign in to mark this gift so it stays reserved across phones.
                </p>
              )}

              <div className="mt-5 space-y-2">
                <label className="flex cursor-pointer gap-3 rounded-2xl border-2 border-line bg-mist/60 p-3 transition hover:bg-mist-deep/40">
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
                {list.hasRecipientAddress ? (
                  <label className="flex cursor-pointer gap-3 rounded-2xl border-2 border-line bg-mist/60 p-3 transition hover:bg-mist-deep/40">
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
                ) : (
                  <p className="rounded-2xl border border-dashed border-line bg-mist/40 p-3 text-sm text-ink-soft">
                    Owner hasn’t added a ship-to address. You can still claim and
                    give the gift in person.
                  </p>
                )}
              </div>

              {claimError && (
                <p className="mt-3 text-sm font-semibold text-coral-deep">
                  {claimError}
                </p>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                <Button disabled={busy} onClick={() => void confirmClaim()}>
                  {busy
                    ? "Saving…"
                    : cloud && !user
                      ? "Sign in to reserve"
                      : "Mark as taken"}
                </Button>
                <Button variant="secondary" onClick={() => setActiveItem(null)}>
                  Cancel
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
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
