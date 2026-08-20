"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatMinor } from "@/lib/site";
import type { GiftItem } from "@/lib/types";

type Props = {
  item: GiftItem | null;
  ownerName: string;
  onClose: () => void;
  onPledge: (input: {
    amountMinor: number;
    giverName?: string;
    message?: string;
    anonymous: boolean;
  }) => Promise<void>;
};

export function ContributeSheet({ item, ownerName, onClose, onPledge }: Props) {
  const [amount, setAmount] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [anonymous, setAnonymous] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goal = item?.goalMinor ?? 0;
  const funded = item?.fundedMinor ?? 0;
  const remaining = Math.max(0, goal - funded);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const dollars = Number(amount);
    if (!Number.isFinite(dollars) || dollars < 1) {
      setError("Enter at least $1.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onPledge({
        amountMinor: Math.round(dollars * 100),
        giverName: anonymous ? undefined : name.trim() || undefined,
        message: message.trim() || undefined,
        anonymous,
      });
      setAmount("");
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not record pledge");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={Boolean(item)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {item && (
          <>
            <DialogHeader>
              <DialogTitle>Contribute toward {item.title}</DialogTitle>
              <DialogDescription>
                Chip in for {ownerName}. This records a pledge on the list so
                everyone can see progress. Card checkout is the next payment
                step — nothing is charged here.
              </DialogDescription>
            </DialogHeader>
            <p className="text-sm text-ink-soft">
              {formatMinor(funded)} of {formatMinor(goal)} pledged
              {remaining > 0 ? ` · ${formatMinor(remaining)} to go` : " · goal reached"}
            </p>
            <form onSubmit={onSubmit} className="mt-3 space-y-3">
              <div>
                <label className="label" htmlFor="pledge-amount">
                  Amount (USD)
                </label>
                <input
                  id="pledge-amount"
                  className="field"
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="25"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={anonymous}
                  onChange={(e) => setAnonymous(e.target.checked)}
                />
                Keep my name off the list
              </label>
              {!anonymous && (
                <div>
                  <label className="label" htmlFor="pledge-name">
                    Name
                  </label>
                  <input
                    id="pledge-name"
                    className="field"
                    value={name}
                    maxLength={80}
                  onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
              )}
              <div>
                <label className="label" htmlFor="pledge-message">
                  Note (optional)
                </label>
                <input
                  id="pledge-message"
                  className="field"
                  value={message}
                  maxLength={280}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="A short wish"
                />
              </div>
              {error && <p className="text-sm text-coral-deep">{error}</p>}
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Saving…" : "Contribute now"}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
