"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Countdown } from "@/components/Countdown";
import { GiftGlyph } from "@/components/GiftGlyph";
import { useGivy } from "@/lib/givy-context";
import { formatMoney } from "@/lib/api";
import type { GiftItem } from "@/lib/types";
import { OCCASION_EMOJI, OCCASION_LABELS } from "@/lib/types";

export default function ManageListPage() {
  const params = useParams<{ id: string }>();
  const {
    lists,
    cloud,
    addItem,
    updateItem,
    removeItem,
    publishList,
    deleteList,
    updateList,
  } = useGivy();
  const router = useRouter();
  const list = useMemo(
    () => lists.find((l) => l.id === params.id) ?? null,
    [lists, params.id],
  );

  const [titleInput, setTitleInput] = useState("");
  const [priceInput, setPriceInput] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [notesInput, setNotesInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [addressDraft, setAddressDraft] = useState("");
  const [supportUrlDraft, setSupportUrlDraft] = useState("");
  const [supportLabelDraft, setSupportLabelDraft] = useState("Support me");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaDate, setMetaDate] = useState("");

  useEffect(() => {
    setAddressDraft(list?.recipientAddress ?? "");
    setSupportUrlDraft(list?.supportUrl ?? "");
    setSupportLabelDraft(list?.supportLabel ?? "Support me");
    setMetaTitle(list?.title ?? "");
    setMetaDescription(list?.description ?? "");
    setMetaDate(list?.eventDate ?? "");
  }, [
    list?.id,
    list?.recipientAddress,
    list?.supportUrl,
    list?.supportLabel,
    list?.title,
    list?.description,
    list?.eventDate,
  ]);

  if (!list) {
    return (
      <div className="panel p-8 text-center">
        <p className="font-display text-2xl">List not found</p>
        <Link href="/app/lists" className="btn btn-primary mt-4">
          Back to lists
        </Link>
      </div>
    );
  }

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/g/${list.shareCode}`
      : `/g/${list.shareCode}`;

  function startEdit(item: GiftItem) {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditPrice(item.price != null ? String(item.price) : "");
    setEditUrl(item.url ?? "");
    setEditNotes(item.notes ?? "");
  }

  async function saveEdit() {
    if (!list || !editingId || !editTitle.trim()) return;
    setBusy(true);
    try {
      await updateItem(list.id, editingId, {
        title: editTitle.trim(),
        price: editPrice ? Number(editPrice) : undefined,
        url: editUrl.trim() || undefined,
        notes: editNotes.trim() || undefined,
      });
      toast.success("Gift updated");
      setEditingId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update gift");
    } finally {
      setBusy(false);
    }
  }

  async function onAdd(e: FormEvent) {
    e.preventDefault();
    if (!list || !titleInput.trim()) return;
    setBusy(true);
    try {
      await addItem(list.id, {
        title: titleInput.trim(),
        price: priceInput ? Number(priceInput) : undefined,
        url: urlInput.trim() || undefined,
        notes: notesInput.trim() || undefined,
      });
      setTitleInput("");
      setPriceInput("");
      setUrlInput("");
      setNotesInput("");
      toast.success("Gift added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add gift");
    } finally {
      setBusy(false);
    }
  }

  async function copyShare() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied");
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Could not copy. Select the link and copy manually.");
    }
  }

  async function onPublish() {
    if (!list) return;
    setBusy(true);
    try {
      await publishList(list.id);
      toast.success("List is live");
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        toast.message("Share link copied");
        window.setTimeout(() => setCopied(false), 1600);
      } catch {
        /* copy optional */
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not publish");
    } finally {
      setBusy(false);
    }
  }

  async function onNativeShare() {
    if (!list) return;
    if (!navigator.share) {
      await copyShare();
      return;
    }
    try {
      await navigator.share({
        title: list.title,
        text: `Gift ideas for ${list.title}`,
        url: shareUrl,
      });
    } catch {
      /* user cancelled */
    }
  }

  async function saveMeta() {
    if (!list || !metaTitle.trim()) return;
    setBusy(true);
    try {
      await updateList(list.id, {
        title: metaTitle.trim(),
        description: metaDescription.trim() || undefined,
        eventDate: metaDate || list.eventDate,
      });
      toast.success("List details saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  const sharePanel = (
    <div className="panel border-2 border-coral/30 p-5">
      <p className="font-display text-xl text-ink">Share</p>
      <p className="mt-1 text-sm text-ink-soft">
        Finalize, then send this link. Friends mark gifts purchased privately.
      </p>
      {!cloud && (
        <p className="mt-2 rounded-xl bg-amber/30 px-3 py-2 text-xs font-semibold text-ink">
          Local demo: share links only work in this browser. Cloud mode shares
          across devices.
        </p>
      )}
      <div className="mt-4 rounded-2xl border border-line bg-paper/80 p-3 text-sm break-all text-ink-soft">
        {shareUrl}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {!list.published ? (
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy}
            onClick={() => void onPublish()}
          >
            Finalize & share
          </button>
        ) : (
          <>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => void copyShare()}
            >
              {copied ? "Copied" : "Copy link"}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => void onNativeShare()}
            >
              Share…
            </button>
          </>
        )}
        <Link
          href={`/g/${list.shareCode}`}
          className="btn btn-secondary"
          onClick={(e) => {
            if (!list.published) {
              e.preventDefault();
              toast.message("Finalize the list first so friends can open it.");
            }
          }}
        >
          Preview
        </Link>
      </div>
      {list.published && (
        <p className="mt-3 text-xs font-semibold text-leaf">Live for friends</p>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <Link href="/app/lists" className="text-sm font-semibold text-ink-soft">
        ← Lists
      </Link>

      <div className="lg:hidden">{sharePanel}</div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="animate-rise space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-leaf">
                {OCCASION_EMOJI[list.occasion]} {OCCASION_LABELS[list.occasion]}
              </p>
              <h1 className="mt-1 font-display text-4xl tracking-tight text-ink">
                {list.title}
              </h1>
              {list.description && (
                <p className="mt-2 max-w-xl text-ink-soft">{list.description}</p>
              )}
            </div>
            <Countdown eventDate={list.eventDate} />
          </div>

          <div className="panel space-y-3 p-5">
            <p className="font-display text-xl text-ink">List details</p>
            <input
              className="field"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              placeholder="Title"
            />
            <textarea
              className="field min-h-20"
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder="Note for friends"
            />
            <input
              className="field"
              type="date"
              value={metaDate}
              onChange={(e) => setMetaDate(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-secondary"
              disabled={busy}
              onClick={() => void saveMeta()}
            >
              Save details
            </button>
          </div>

          {list.items.length === 0 ? (
            <div className="panel p-6 text-center">
              <p className="font-display text-xl">No gifts yet</p>
              <p className="mt-1 text-sm text-ink-soft">
                Add your first idea below.
              </p>
            </div>
          ) : (
            <ul className="stagger space-y-3">
              {list.items.map((item) => (
                <li
                  key={item.id}
                  className={`panel p-4 ${item.purchased ? "gift-claimed" : ""}`}
                >
                  {editingId === item.id ? (
                    <div className="space-y-3">
                      <input
                        className="field"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                      />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <input
                          className="field"
                          type="number"
                          min="0"
                          placeholder="Price"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                        />
                        <input
                          className="field"
                          placeholder="Product URL"
                          value={editUrl}
                          onChange={(e) => setEditUrl(e.target.value)}
                        />
                      </div>
                      <input
                        className="field"
                        placeholder="Notes"
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="btn btn-primary"
                          disabled={busy}
                          onClick={() => void saveEdit()}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <GiftGlyph hint={item.imageHint} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <p className="gift-title font-semibold text-ink">
                            {item.title}
                          </p>
                          {item.purchased ? (
                            <p className="text-sm font-semibold text-ink-soft">
                              Claimed
                            </p>
                          ) : (
                            <span className="price-badge">
                              {formatMoney(item.price)}
                            </span>
                          )}
                        </div>
                        {item.notes && (
                          <p className="mt-1 text-sm text-ink-soft">
                            {item.notes}
                          </p>
                        )}
                        {item.url && !item.purchased && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-block text-sm font-semibold text-coral-deep underline-offset-2 hover:underline"
                          >
                            Open product link
                          </a>
                        )}
                      </div>
                      {!item.purchased && (
                        <div className="flex shrink-0 flex-col gap-1">
                          <button
                            type="button"
                            className="btn btn-ghost text-sm"
                            onClick={() => startEdit(item)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost text-sm text-coral-deep"
                            onClick={() => {
                              if (!confirm(`Remove “${item.title}”?`)) return;
                              void removeItem(list.id, item.id)
                                .then(() => toast.success("Removed"))
                                .catch((err) =>
                                  toast.error(
                                    err instanceof Error
                                      ? err.message
                                      : "Could not remove",
                                  ),
                                );
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={onAdd} className="panel space-y-3 p-5">
            <p className="font-display text-xl text-ink">Add a gift idea</p>
            <input
              className="field"
              placeholder="Title"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              required
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                className="field"
                placeholder="Price (optional)"
                type="number"
                min="0"
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
              />
              <input
                className="field"
                placeholder="Product URL"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
              />
            </div>
            <input
              className="field"
              placeholder="Notes"
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
            />
            <button type="submit" className="btn btn-secondary" disabled={busy}>
              Add to list
            </button>
          </form>
        </section>

        <aside className="hidden animate-rise space-y-4 lg:sticky lg:top-6 lg:block lg:self-start">
          {sharePanel}

          <div className="panel p-5">
            <p className="font-display text-xl text-ink">Shipping address</p>
            <p className="mt-1 text-sm text-ink-soft">
              Used when a friend ships the gift straight to you.
            </p>
            <textarea
              className="field mt-3 min-h-24"
              value={addressDraft}
              onChange={(e) => setAddressDraft(e.target.value)}
              placeholder="123 Gift Lane…"
            />
            <button
              type="button"
              className="btn btn-secondary mt-3"
              disabled={busy}
              onClick={() => {
                void updateList(list.id, {
                  recipientAddress: addressDraft.trim() || undefined,
                })
                  .then(() => toast.success("Address saved"))
                  .catch((err) =>
                    toast.error(
                      err instanceof Error ? err.message : "Could not save",
                    ),
                  );
              }}
            >
              Save address
            </button>
          </div>

          <div className="panel p-5">
            <p className="font-display text-xl text-ink">Support me</p>
            <p className="mt-1 text-sm text-ink-soft">
              Optional tip link for creators on your public list.
            </p>
            <label className="label mt-3" htmlFor="supportUrl">
              Support link
            </label>
            <input
              id="supportUrl"
              className="field"
              type="url"
              value={supportUrlDraft}
              onChange={(e) => setSupportUrlDraft(e.target.value)}
              placeholder="https://ko-fi.com/yourname"
            />
            <label className="label mt-3" htmlFor="supportLabel">
              Button text
            </label>
            <input
              id="supportLabel"
              className="field"
              value={supportLabelDraft}
              onChange={(e) => setSupportLabelDraft(e.target.value)}
              placeholder="Support me"
            />
            <button
              type="button"
              className="btn btn-secondary mt-3"
              disabled={busy}
              onClick={() => {
                void updateList(list.id, {
                  supportUrl: supportUrlDraft.trim() || undefined,
                  supportLabel: supportUrlDraft.trim()
                    ? supportLabelDraft.trim() || "Support me"
                    : undefined,
                })
                  .then(() => toast.success("Support link saved"))
                  .catch((err) =>
                    toast.error(
                      err instanceof Error ? err.message : "Could not save",
                    ),
                  );
              }}
            >
              Save support link
            </button>
          </div>

          <button
            type="button"
            className="btn btn-ghost text-sm text-coral-deep"
            onClick={() => {
              if (!confirm("Delete this Givito?")) return;
              void deleteList(list.id)
                .then(() => {
                  toast.success("List deleted");
                  router.push("/app/lists");
                })
                .catch((err) =>
                  toast.error(
                    err instanceof Error ? err.message : "Could not delete",
                  ),
                );
            }}
          >
            Delete list
          </button>
        </aside>
      </div>

      <div className="space-y-4 lg:hidden">
        <div className="panel p-5">
          <p className="font-display text-xl text-ink">Shipping address</p>
          <textarea
            className="field mt-3 min-h-24"
            value={addressDraft}
            onChange={(e) => setAddressDraft(e.target.value)}
            placeholder="123 Gift Lane…"
          />
          <button
            type="button"
            className="btn btn-secondary mt-3"
            onClick={() => {
              void updateList(list.id, {
                recipientAddress: addressDraft.trim() || undefined,
              }).then(() => toast.success("Address saved"));
            }}
          >
            Save address
          </button>
        </div>
        <div className="panel p-5">
          <p className="font-display text-xl text-ink">Support me</p>
          <input
            className="field mt-3"
            type="url"
            value={supportUrlDraft}
            onChange={(e) => setSupportUrlDraft(e.target.value)}
            placeholder="https://ko-fi.com/yourname"
          />
          <input
            className="field mt-3"
            value={supportLabelDraft}
            onChange={(e) => setSupportLabelDraft(e.target.value)}
            placeholder="Support me"
          />
          <button
            type="button"
            className="btn btn-secondary mt-3"
            onClick={() => {
              void updateList(list.id, {
                supportUrl: supportUrlDraft.trim() || undefined,
                supportLabel: supportUrlDraft.trim()
                  ? supportLabelDraft.trim() || "Support me"
                  : undefined,
              }).then(() => toast.success("Support link saved"));
            }}
          >
            Save support link
          </button>
        </div>
        <button
          type="button"
          className="btn btn-ghost text-sm text-coral-deep"
          onClick={() => {
            if (!confirm("Delete this Givito?")) return;
            void deleteList(list.id).then(() => router.push("/app/lists"));
          }}
        >
          Delete list
        </button>
      </div>
    </div>
  );
}
