"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { GiftGlyph } from "@/components/GiftGlyph";
import { FIELD_LIMITS, safeHttpsUrl } from "@/lib/security";
import type { GiftItem } from "@/lib/types";

export type GiftDraft = Pick<GiftItem, "title" | "notes" | "price" | "url" | "imageHint">;

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
  const [imageHint, setImageHint] = useState("");
  const [quantity, setQuantity] = useState("");
  const [quantityNeeded, setQuantityNeeded] = useState("");
  const [priority, setPriority] = useState<"high" | "medium" | "low" | "">("");
  const [groupFund, setGroupFund] = useState(false);
  const [previewBusy, setPreviewBusy] = useState(false);
  const previewForUrl = useRef<string | null>(null);

  useEffect(() => {
    if (!prefill) return;
    setTitle(prefill.title ?? "");
    setNotes(prefill.notes ?? "");
    setPrice(prefill.price != null ? String(prefill.price) : "");
    setUrl(prefill.url ?? "");
    setImageHint(prefill.imageHint ?? "");
  }, [prefill]);

  useEffect(() => {
    const https = safeHttpsUrl(url);
    if (!https) return;
    if (imageHint.trim()) return;
    if (previewForUrl.current === https) return;

    const handle = window.setTimeout(() => {
      previewForUrl.current = https;
      setPreviewBusy(true);
      void fetch(`/api/link-preview?url=${encodeURIComponent(https)}`, {
        credentials: "same-origin",
      })
        .then(async (res) => {
          if (!res.ok) return;
          const data = (await res.json()) as {
            imageUrl?: string | null;
            title?: string | null;
          };
          if (data.imageUrl && !imageHint.trim()) {
            setImageHint(data.imageUrl);
          }
          if (data.title && !title.trim()) {
            setTitle(data.title.slice(0, FIELD_LIMITS.itemTitle));
          }
        })
        .catch(() => {
          /* ignore preview failures */
        })
        .finally(() => setPreviewBusy(false));
    }, 600);

    return () => window.clearTimeout(handle);
  }, [url, imageHint, title]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    try {
      const giftUrl = parseGiftUrl(url);
      const image =
        safeHttpsUrl(imageHint) ??
        (imageHint.trim() && !/^[a-z][a-z0-9+.-]*:/i.test(imageHint.trim())
          ? imageHint.trim()
          : undefined);
      if (imageHint.trim() && !image && /^https?:/i.test(imageHint.trim())) {
        throw new Error("Image links must start with https://");
      }
      if (groupFund && !price) {
        toast.error("Group-fund gifts need a price so there is a goal.");
        return;
      }
      await onAdd({
        title: title.trim().slice(0, FIELD_LIMITS.itemTitle),
        price: price ? Number(price) : undefined,
        url: giftUrl,
        notes: notes.trim().slice(0, FIELD_LIMITS.notes) || undefined,
        imageHint: image,
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
      setImageHint("");
      setQuantity("");
      setQuantityNeeded("");
      setPriority("");
      setGroupFund(false);
      previewForUrl.current = null;
      toast.success("Gift added");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add gift");
    }
  }

  return (
    <form onSubmit={submit} className="panel space-y-3 p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="font-display text-xl text-ink">Add a gift idea</p>
        <GiftGlyph title={title || "Gift"} hint={imageHint || undefined} size="lg" />
      </div>
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
      <input
        className="field"
        placeholder="https:// image link (optional — auto-fills from product)"
        value={imageHint}
        maxLength={FIELD_LIMITS.url}
        onChange={(event) => setImageHint(event.target.value)}
      />
      {previewBusy && (
        <p className="text-xs font-semibold text-ink-soft">Looking up product photo…</p>
      )}
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
