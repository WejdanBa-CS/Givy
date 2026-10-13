"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { GiftGlyph } from "@/components/GiftGlyph";
import { useProductLinkPreview } from "@/hooks/useProductLinkPreview";
import { isGiftImageUrl } from "@/lib/gift-visual";
import { FIELD_LIMITS, safeHttpsUrl } from "@/lib/security";
import type { GiftItem } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type EditGiftDialogProps = {
  item: GiftItem | null;
  busy?: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (
    patch: Partial<
      Pick<
        GiftItem,
        | "title"
        | "notes"
        | "url"
        | "price"
        | "imageHint"
        | "quantity"
        | "quantityNeeded"
        | "priority"
      >
    >,
  ) => Promise<void>;
};

function parseGiftUrl(raw: string): string | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const https = safeHttpsUrl(trimmed);
  if (!https) throw new Error("Gift links must start with https://");
  return https;
}

export function EditGiftDialog({ item, busy = false, onOpenChange, onSave }: EditGiftDialogProps) {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [imageHint, setImageHint] = useState("");
  const [quantity, setQuantity] = useState("");
  const [quantityNeeded, setQuantityNeeded] = useState("");
  const [priority, setPriority] = useState<"high" | "medium" | "low" | "">("");

  const { previewBusy, previewMiss, ensurePreview, resetPreviewTracking } =
    useProductLinkPreview({
      url,
      imageHint,
      title,
      setImageHint,
      setTitle,
    });

  useEffect(() => {
    if (!item) return;
    setTitle(item.title);
    setPrice(item.price != null ? String(item.price) : "");
    setUrl(item.url ?? "");
    setNotes(item.notes ?? "");
    setImageHint(item.imageHint ?? "");
    setQuantity(item.quantity != null ? String(item.quantity) : "");
    setQuantityNeeded(item.quantityNeeded != null ? String(item.quantityNeeded) : "");
    setPriority(item.priority ?? "");
    resetPreviewTracking();
  }, [item, resetPreviewTracking]);

  async function save() {
    if (!item || !title.trim()) return;
    try {
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
      await onSave({
        title: (title.trim() || preview.title || item.title).slice(0, FIELD_LIMITS.itemTitle),
        price: price ? Number(price) : undefined,
        url: parseGiftUrl(url),
        notes: notes.trim().slice(0, FIELD_LIMITS.notes) || undefined,
        imageHint: image,
        quantity: quantity ? Number(quantity) : undefined,
        quantityNeeded: quantityNeeded ? Number(quantityNeeded) : undefined,
        priority: priority || undefined,
      });
      toast.success("Gift updated");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update gift");
    }
  }

  const hasProductPhoto = isGiftImageUrl(imageHint);

  return (
    <Dialog open={Boolean(item)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit gift</DialogTitle>
          <DialogDescription>
            Paste a product link to refresh the photo shown on this wishlist.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-3">
          {(hasProductPhoto || previewBusy) && (
            <div className="overflow-hidden rounded-2xl border-2 border-line bg-mist-deep">
              {hasProductPhoto ? (
                <GiftGlyph title={title || "Gift"} hint={imageHint} size="card" />
              ) : (
                <div className="flex h-36 items-center justify-center text-xs font-bold text-ink-soft">
                  Finding photo…
                </div>
              )}
            </div>
          )}
          {!hasProductPhoto && !previewBusy && (
            <div className="flex items-start gap-3">
              <GiftGlyph title={title || "Gift"} hint={imageHint || undefined} size="lg" />
              <input
                className="field flex-1"
                value={title}
                maxLength={FIELD_LIMITS.itemTitle}
                onChange={(event) => setTitle(event.target.value)}
              />
            </div>
          )}
          {hasProductPhoto && (
            <input
              className="field"
              value={title}
              maxLength={FIELD_LIMITS.itemTitle}
              onChange={(event) => setTitle(event.target.value)}
            />
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className="field"
              type="number"
              min="0"
              placeholder="Price"
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
          {previewBusy && (
            <p className="text-xs font-semibold text-ink-soft">Finding product photo…</p>
          )}
          {!previewBusy && previewMiss && safeHttpsUrl(url) && !hasProductPhoto && (
            <p className="text-xs font-semibold text-ink-soft">
              No photo found from that link — you can paste an image URL below.
            </p>
          )}
          <input
            className="field"
            placeholder="https:// image link (optional)"
            value={imageHint}
            maxLength={FIELD_LIMITS.url}
            onChange={(event) => setImageHint(event.target.value)}
          />
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
              onChange={(event) =>
                setPriority(event.target.value as "high" | "medium" | "low" | "")
              }
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
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" className="btn btn-secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy || previewBusy}
              onClick={() => void save()}
            >
              Save
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
