"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
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
  const [quantity, setQuantity] = useState("");
  const [quantityNeeded, setQuantityNeeded] = useState("");
  const [priority, setPriority] = useState<"high" | "medium" | "low" | "">("");

  useEffect(() => {
    if (!item) return;
    setTitle(item.title);
    setPrice(item.price != null ? String(item.price) : "");
    setUrl(item.url ?? "");
    setNotes(item.notes ?? "");
    setQuantity(item.quantity != null ? String(item.quantity) : "");
    setQuantityNeeded(item.quantityNeeded != null ? String(item.quantityNeeded) : "");
    setPriority(item.priority ?? "");
  }, [item]);

  async function save() {
    if (!item || !title.trim()) return;
    try {
      await onSave({
        title: title.trim().slice(0, FIELD_LIMITS.itemTitle),
        price: price ? Number(price) : undefined,
        url: parseGiftUrl(url),
        notes: notes.trim().slice(0, FIELD_LIMITS.notes) || undefined,
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

  return (
    <Dialog open={Boolean(item)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit gift</DialogTitle>
          <DialogDescription>Update the details shown on this wishlist.</DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-3">
          <input className="field" value={title} maxLength={FIELD_LIMITS.itemTitle} onChange={(event) => setTitle(event.target.value)} />
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="field" type="number" min="0" placeholder="Price" value={price} onChange={(event) => setPrice(event.target.value)} />
            <input className="field" placeholder="https:// product link" value={url} maxLength={FIELD_LIMITS.url} onChange={(event) => setUrl(event.target.value)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <input className="field" type="number" min="1" placeholder="Quantity" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
            <input className="field" type="number" min="1" placeholder="Needed" value={quantityNeeded} onChange={(event) => setQuantityNeeded(event.target.value)} />
            <select className="field" value={priority} onChange={(event) => setPriority(event.target.value as "high" | "medium" | "low" | "")}>
              <option value="">Priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <input className="field" placeholder="Notes" value={notes} maxLength={FIELD_LIMITS.notes} onChange={(event) => setNotes(event.target.value)} />
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" className="btn btn-secondary" onClick={() => onOpenChange(false)}>Cancel</button>
            <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void save()}>Save</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
