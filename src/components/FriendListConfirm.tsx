"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  shareCode: string;
  ownerName: string;
  listTitle: string;
  signedInAs: string;
  confirmed: boolean;
  onConfirmed: () => void;
};

function storageKey(code: string) {
  return `givy.friendListConfirm.${code}`;
}

export function FriendListConfirm({
  shareCode,
  ownerName,
  listTitle,
  signedInAs,
  confirmed,
  onConfirmed,
}: Props) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(storageKey(shareCode)) === "1") {
        onConfirmed();
      }
    } catch {
      /* private mode */
    }
    setReady(true);
  }, [shareCode, onConfirmed]);

  function confirm() {
    try {
      sessionStorage.setItem(storageKey(shareCode), "1");
    } catch {
      /* ignore */
    }
    onConfirmed();
  }

  if (!ready || confirmed) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/45 p-4 backdrop-blur-[2px] sm:items-center"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="friend-confirm-title"
    >
      <div className="w-full max-w-md rounded-[1.25rem] border-2 border-line bg-paper p-5 shadow-[0_30px_80px_-40px_rgba(26,18,14,0.45)] sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-coral-deep">
          Check before you claim
        </p>
        <h2
          id="friend-confirm-title"
          className="mt-2 font-display text-2xl text-ink"
        >
          Is this your friend’s list?
        </h2>
        <p className="mt-2 text-sm text-ink-soft">
          You’re signed in as <strong className="text-ink">{signedInAs}</strong>.
          Confirm this wishlist belongs to the friend you meant to shop for —
          not your own account, and not someone else.
        </p>
        <div className="mt-4 rounded-2xl border border-line bg-mist/70 p-4 text-sm">
          <p className="font-semibold text-ink">{listTitle}</p>
          <p className="mt-1 text-ink-soft">Owner: {ownerName}</p>
        </div>
        <p className="mt-3 text-sm text-ink-soft">
          If this isn’t right, leave and open the link they sent you.
        </p>
        <Button className="mt-5 w-full" onClick={confirm}>
          Yes — this is {ownerName}&apos;s list
        </Button>
      </div>
    </div>
  );
}
