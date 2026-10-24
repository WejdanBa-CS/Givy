"use client";

import { ChevronDown } from "lucide-react";
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
          <p className="font-display text-xl font-semibold text-ink">Add a gift idea</p>
          <p className="mt-0.5 text-sm text-ink-soft">
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
          <p className="mt-1.5 text-xs text-ink-soft">Finding product photo…</p>
        )}
      </div>

      {(hasProductPhoto || previewBusy) && (
        <div className="overflow-hidden rounded-xl border border-line/80 bg-white">
          <div className="relative">
            {hasProductPhoto ? (
              <GiftGlyph title={title || "Gift"} hint={imageHint} size="card" />
            ) : (
              <div className="flex h-36 items-center justify-center text-xs font-semibold text-ink-soft">
                Loading photo…
              </div>
            )}
            {hasProductPhoto && (
              <span className="absolute left-2.5 top-2.5 inline-flex h-6 items-center rounded-full bg-leaf/10 px-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-leaf">
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
        aria-expanded={showImageOverride}
        className="inline-flex min-h-9 items-center gap-1 text-[13px] font-medium text-ink-soft transition hover:text-ink"
        onClick={() => setShowImageOverride((v) => !v)}
      >
        <ChevronDown
          aria-hidden
          size={15}
          strokeWidth={1.75}
          className={`transition-transform duration-200 ${showImageOverride ? "rotate-180" : ""}`}
        />
        {showImageOverride ? "Fewer options" : "More options"}
      </button>
      {showImageOverride && (
        <div className="space-y-3">
          <input
            className="field"
            placeholder="Photo URL (optional, replaces the shop photo)"
            value={imageHint}
            maxLength={FIELD_LIMITS.url}
            onChange={(event) => setImageHint(event.target.value)}
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
              className="field col-span-2 sm:col-span-1"
              value={priority}
              onChange={(event) => setPriority(event.target.value as "high" | "medium" | "low" | "")}
            >
              <option value="">Priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      )}
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line/80 bg-mist/40 p-3.5 text-sm text-ink-soft">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 shrink-0 accent-coral"
          checked={groupFund}
          onChange={(event) => setGroupFund(event.target.checked)}
        />
        <span>
          <span className="block font-medium text-ink">Group fund this gift</span>
          Friends chip in toward the price instead of buying it alone.
        </span>
      </label>
      <button type="submit" className="btn btn-primary w-full" disabled={busy || previewBusy}>
        Add to list
      </button>
    </form>
  );
}
