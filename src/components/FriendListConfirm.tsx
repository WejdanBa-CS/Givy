"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
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
  const confirmedAction = useRef(false);
  const router = useRouter();

  useEffect(() => {
    try {
      if (sessionStorage.getItem(storageKey(shareCode)) === "1") onConfirmed();
    } catch {
      // Private browsing may block session storage; confirmation still works in memory.
    }
    setReady(true);
  }, [shareCode, onConfirmed]);

  function confirm() {
    confirmedAction.current = true;
    try {
      sessionStorage.setItem(storageKey(shareCode), "1");
    } catch {
      // Confirmation remains active for this rendered view if storage is unavailable.
    }
    onConfirmed();
  }

  if (!ready || confirmed) return null;

  return (
    <AlertDialog.Root
      open
      onOpenChange={(open) => {
        if (!open && !confirmedAction.current) router.push("/app/lists");
      }}
    >
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-[60] bg-ink/45 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <AlertDialog.Content className="fixed inset-x-4 bottom-4 z-[61] mx-auto w-auto max-w-md rounded-[1.25rem] border-2 border-line bg-paper p-5 shadow-[0_30px_80px_-40px_rgba(26,18,14,0.45)] outline-none sm:inset-auto sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:-translate-x-1/2 sm:-translate-y-1/2 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-coral-deep">Check before you claim</p>
          <AlertDialog.Title className="mt-2 font-display text-2xl text-ink">Is this your friend’s list?</AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm text-ink-soft">
            You’re signed in as <strong className="text-ink">{signedInAs}</strong>. Confirm this wishlist belongs to the friend you meant to shop for — not your own account, and not someone else.
          </AlertDialog.Description>
          <div className="mt-4 rounded-2xl border border-line bg-mist/70 p-4 text-sm"><p className="font-semibold text-ink">{listTitle}</p><p className="mt-1 text-ink-soft">Owner: {ownerName}</p></div>
          <p className="mt-3 text-sm text-ink-soft">If this isn’t right, leave and open the link they sent you.</p>
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <AlertDialog.Cancel asChild><Button variant="secondary">Leave list</Button></AlertDialog.Cancel>
            <AlertDialog.Action asChild><Button onClick={confirm}>Yes — this is {ownerName}&apos;s list</Button></AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
