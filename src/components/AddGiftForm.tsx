"use client";

import { type FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { GiftGlyph } from "@/components/GiftGlyph";
import { useProductLinkPreview } from "@/hooks/useProductLinkPreview";
import { isGiftImageUrl } from "@/lib/gift-visual";
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
  const [showImageOverride, setShowImageOverride] = useState(false);

  const { previewBusy, ensurePreview, resetPreviewTracking } =
    useProductLinkPreview({
      url,
      imageHint,
      title,
      setImageHint,
      setTitle,
    });

  useEffect(() => {
    if (!prefill) return;
    setTitle(prefill.title ?? "");
    setNotes(prefill.notes ?? "");
    setPrice(prefill.price != null ? String(prefill.price) : "");
    setUrl(prefill.url ?? "");
    setImageHint(prefill.imageHint ?? "");
  }, [prefill]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim() && !safeHttpsUrl(url)) return;
    try {
      const giftUrl = parseGiftUrl(url);
      const preview = await ensurePreview();
      const image =
        preview.imageUrl ??
        safeHttpsUrl(imageHint) ??
        (imageHint.trim() && !/^[a-z][a-z0-9+.-]*:/i.test(imageHint.trim())
          ? imageHint.trim()
          : undefined);
      if (imageHint.trim() && !image && /^https?:/i.test(imageHint.trim())) {
        throw new Error("Image links must start with https://");
      }
      const finalTitle = (title.trim() || preview.title || "Gift idea").slice(
        0,
        FIELD_LIMITS.itemTitle,
      );
      if (groupFund && !price) {
        toast.error("Group-fund gifts need a price so there is a goal.");
        return;
      }
      await onAdd({
        title: finalTitle,
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
      setShowImageOverride(false);
      resetPreviewTracking();
      toast.success("Gift added");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add gift");
    }
  }

  const hasProductPhoto = isGiftImageUrl(imageHint);

  return (
    <form onSubmit={submit} className="panel space-y-3 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-xl font-black text-ink">Add a gift idea</p>
          <p className="mt-0.5 text-xs font-semibold text-ink-soft">
            Paste a product link — we’ll pull the photo for your list.
          </p>
        </div>
      </div>

      <div>
        <label className="label" htmlFor="gift-product-url">
          Product link
        </label>
        <input
          id="gift-product-url"
          className="field"
          placeholder="https://… paste Amazon, Apple, or any shop link"
          value={url}
          maxLength={FIELD_LIMITS.url}
          onChange={(event) => setUrl(event.target.value)}
          inputMode="url"
          autoComplete="url"
        />
        {previewBusy && (
          <p className="mt-1.5 text-xs font-semibold text-ink-soft">Finding product photo…</p>
        )}
      </div>

      {(hasProductPhoto || previewBusy) && (
        <div className="overflow-hidden rounded-2xl border-2 border-line bg-mist-deep">
          <div className="relative">
            {hasProductPhoto ? (
              <GiftGlyph title={title || "Gift"} hint={imageHint} size="card" />
            ) : (
              <div className="flex h-36 items-center justify-center text-xs font-bold text-ink-soft">
                Loading photo…
              </div>
            )}
            {hasProductPhoto && (
              <span className="absolute bottom-2.5 left-2.5 rounded-xl bg-paper/95 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-leaf">
                Product photo
              </span>
            )}
          </div>
        </div>
      )}

      <input
        className="field"
        placeholder="Title"
        value={title}
        maxLength={FIELD_LIMITS.itemTitle}
        onChange={(event) => setTitle(event.target.value)}
        required={!safeHttpsUrl(url)}
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
          placeholder="Notes"
          value={notes}
          maxLength={FIELD_LIMITS.notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </div>

      <button
        type="button"
        className="text-xs font-bold text-ink-soft underline-offset-2 hover:text-ink hover:underline"
        onClick={() => setShowImageOverride((v) => !v)}
      >
        {showImageOverride ? "Hide image URL" : "Override photo URL"}
      </button>
      {showImageOverride && (
        <input
          className="field"
          placeholder="https:// image link (optional)"
          value={imageHint}
          maxLength={FIELD_LIMITS.url}
          onChange={(event) => setImageHint(event.target.value)}
        />
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
      <button type="submit" className="btn btn-secondary w-full sm:w-auto" disabled={busy || previewBusy}>
        Add to list
      </button>
    </form>
  );
}
