"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { FIELD_LIMITS, paypalMeUrl, safeSupportUrl } from "@/lib/security";
import type { GivyList } from "@/lib/types";

type ListSettingsPanelProps = {
  list: GivyList;
  busy?: boolean;
  onUpdate: (patch: Partial<GivyList>) => Promise<void>;
  onDelete: () => Promise<void>;
};

export function ListSettingsPanel({
  list,
  busy = false,
  onUpdate,
  onDelete,
}: ListSettingsPanelProps) {
  const [address, setAddress] = useState("");
  const [supportUrl, setSupportUrl] = useState("");
  const [supportLabel, setSupportLabel] = useState("Support me");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setAddress(list.recipientAddress ?? "");
    setSupportUrl(list.supportUrl ?? "");
    setSupportLabel(list.supportLabel ?? "Support me");
    setTitle(list.title);
    setDescription(list.description ?? "");
    setEventDate(list.eventDate);
    setTags(list.tags ?? []);
  }, [list]);

  function addTag() {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) setTags((current) => [...current, tag]);
    setTagInput("");
  }

  async function saveDetails() {
    try {
      await onUpdate({
        title: title.trim() || list.title,
        description: description.trim() || undefined,
        eventDate: eventDate || list.eventDate,
        tags,
      });
      toast.success("List details saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save list details");
    }
  }

  async function saveAddress() {
    try {
      await onUpdate({ recipientAddress: address.trim() || undefined });
      toast.success("Address saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save address");
    }
  }

  async function saveSupportLink() {
    const raw = supportUrl.trim();
    if (!raw) {
      try {
        await onUpdate({ supportUrl: undefined, supportLabel: undefined });
        toast.success("Support link cleared");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not save support link");
      }
      return;
    }
    const tip = safeSupportUrl(raw) ?? paypalMeUrl(raw);
    if (!tip) {
      toast.error("Use a valid https PayPal.me, PayPal, Ko-fi, or Buy Me a Coffee link.");
      return;
    }
    try {
      await onUpdate({
        supportUrl: tip,
        supportLabel: supportLabel.trim() || "Support with PayPal",
      });
      setSupportUrl(tip);
      toast.success("Support link saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save support link");
    }
  }

  return (
    <div className="space-y-4">
      <details className="panel p-5">
        <summary className="cursor-pointer font-display text-xl text-ink">Edit list details</summary>
        <div className="mt-4 space-y-3">
          <input className="field" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Title" />
          <textarea className="field min-h-20" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Note for friends" />
          <input className="field" type="date" value={eventDate} onChange={(event) => setEventDate(event.target.value)} />
          <div>
            <label className="label">Tags</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-leaf/10 px-3 py-1 text-sm font-semibold text-leaf">
                  {tag}
                  <button type="button" onClick={() => setTags((current) => current.filter((candidate) => candidate !== tag))} className="text-leaf hover:text-coral-deep" aria-label={`Remove ${tag}`}>
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <input className="field flex-1" value={tagInput} onChange={(event) => setTagInput(event.target.value)} placeholder="Add tag..." onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addTag(); } }} />
              <button type="button" className="btn btn-secondary" onClick={addTag}>Add</button>
            </div>
          </div>
          <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => void saveDetails()}>Save details</button>
        </div>
      </details>

      <div className="panel p-5">
        <p className="font-display text-xl text-ink">Shipping address</p>
        <p className="mt-1 text-sm text-ink-soft">Used when a friend ships the gift straight to you.</p>
        <textarea className="field mt-3 min-h-24" value={address} maxLength={FIELD_LIMITS.recipientAddress} onChange={(event) => setAddress(event.target.value)} placeholder="123 Gift Lane…" />
        <button type="button" className="btn btn-secondary mt-3" disabled={busy} onClick={() => void saveAddress()}>Save address</button>
      </div>

      <div className="panel p-5">
        <p className="font-display text-xl text-ink">Support me</p>
        <p className="mt-1 text-sm text-ink-soft">PayPal.me recommended. Tips process on PayPal, not Givy.</p>
        <label className="label mt-3" htmlFor={`support-url-${list.id}`}>PayPal.me or tip link</label>
        <input id={`support-url-${list.id}`} className="field" type="url" value={supportUrl} onChange={(event) => setSupportUrl(event.target.value)} placeholder="https://www.paypal.com/paypalme/yourname" />
        <label className="label mt-3" htmlFor={`support-label-${list.id}`}>Button text</label>
        <input id={`support-label-${list.id}`} className="field" value={supportLabel} onChange={(event) => setSupportLabel(event.target.value)} placeholder="Support with PayPal" />
        <button type="button" className="btn btn-secondary mt-3" disabled={busy} onClick={() => void saveSupportLink()}>Save support link</button>
      </div>

      <button type="button" className="btn btn-ghost text-sm text-coral-deep" onClick={() => setConfirmDelete(true)}>Delete list</button>
      <ConfirmDialog
        open={confirmDelete}
        title="Delete this Givy?"
        description="This removes the list and its local or cloud items. This action cannot be undone."
        confirmLabel="Delete list"
        destructive
        busy={busy}
        onOpenChange={setConfirmDelete}
        onConfirm={() => void onDelete()}
      />
    </div>
  );
}
