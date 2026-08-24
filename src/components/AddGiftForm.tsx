"use client";

import { type FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { FIELD_LIMITS, safeHttpsUrl } from "@/lib/security";
import type { GiftItem } from "@/lib/types";

export type GiftDraft = Pick<GiftItem, "title" | "notes" | "price" | "url">;

type AddGiftFormProps = {
  busy?: boolean;
  prefill?: Partial<GiftDraft> | null;
  onAdd: (
    item: Omit<GiftItem, "id" | "purchased" | "purchasedAt" | "claimedByMe">,
  ) => Promise<void>;
};

function parseGiftUrl(raw: string): string | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const https = safeHttpsUrl(trimmed);
  if (!https) throw new Error("Gift links must start with https://");
  return https;
}

export function AddGiftForm({ busy = false, prefill, onAdd }: AddGiftFormProps) {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [quantity, setQuantity] = useState("");
  const [quantityNeeded, setQuantityNeeded] = useState("");
  const [priority, setPriority] = useState<"high" | "medium" | "low" | "">("");
  const [groupFund, setGroupFund] = useState(false);

  useEffect(() => {
    if (!prefill) return;
    setTitle(prefill.title ?? "");
    setNotes(prefill.notes ?? "");
    setPrice(prefill.price != null ? String(prefill.price) : "");
    setUrl(prefill.url ?? "");
  }, [prefill]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    try {
      const giftUrl = parseGiftUrl(url);
      if (groupFund && !price) {
        toast.error("Group-fund gifts need a price so there is a goal.");
        return;
      }
      await onAdd({
        title: title.trim().slice(0, FIELD_LIMITS.itemTitle),
        price: price ? Number(price) : undefined,
        url: giftUrl,
        notes: notes.trim().slice(0, FIELD_LIMITS.notes) || undefined,
        quantity: quantity ? Number(quantity) : undefined,
        quantityNeeded: quantityNeeded ? Number(quantityNeeded) : undefined,
        priority: priority || undefined,
        fundingMode: groupFund ? "cash_fund" : "direct_purchase",
        goalMinor: groupFund && price ? Math.round(Number(price) * 100) : undefined,
      });
      setTitle("");
      setPrice("");
      setUrl("");
      setNotes("");
      setQuantity("");
      setQuantityNeeded("");
      setPriority("");
      setGroupFund(false);
      toast.success("Gift added");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add gift");
    }
  }

  return (
    <form onSubmit={submit} className="panel space-y-3 p-5">
      <p className="font-display text-xl text-ink">Add a gift idea</p>
      <input
        className="field"
        placeholder="Title"
        value={title}
        maxLength={FIELD_LIMITS.itemTitle}
        onChange={(event) => setTitle(event.target.value)}
        required
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          className="field"
          placeholder="Price (optional)"
          type="number"
          min="0"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
        />
        <input
          className="field"
          placeholder="https:// product link"
          value={url}
          maxLength={FIELD_LIMITS.url}
          onChange={(event) => setUrl(event.target.value)}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <input
          className="field"
          type="number"
          min="1"
          placeholder="Quantity"
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
        />
        <input
          className="field"
          type="number"
          min="1"
          placeholder="Needed"
          value={quantityNeeded}
          onChange={(event) => setQuantityNeeded(event.target.value)}
        />
        <select
          className="field"
          value={priority}
          onChange={(event) => setPriority(event.target.value as "high" | "medium" | "low" | "")}
        >
          <option value="">Priority</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>
      <input
        className="field"
        placeholder="Notes"
        value={notes}
        maxLength={FIELD_LIMITS.notes}
        onChange={(event) => setNotes(event.target.value)}
      />
      <label className="flex items-start gap-2 text-sm text-ink">
        <input
          type="checkbox"
          className="mt-1"
          checked={groupFund}
          onChange={(event) => setGroupFund(event.target.checked)}
        />
        <span>
          <strong>Group fund this gift.</strong> Friends chip in toward the price instead
          of buying it alone. Set a price so there is a goal.
        </span>
      </label>
      <button type="submit" className="btn btn-secondary" disabled={busy}>
        Add to list
      </button>
    </form>
  );
}
