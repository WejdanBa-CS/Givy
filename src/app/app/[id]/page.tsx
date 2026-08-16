"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Countdown } from "@/components/Countdown";
import { AiGiftRecommend } from "@/components/AiGiftRecommend";
import { SuggestGiftsPanel } from "@/components/SuggestGiftsPanel";
import { WishItem } from "@/components/WishItem";
import { useGivy } from "@/lib/givy-context";
import { paypalMeUrl, FIELD_LIMITS, safeHttpsUrl, safeHttpUrl, safeSupportUrl } from "@/lib/security";
import type { GiftItem } from "@/lib/types";
import { OCCASION_EMOJI, OCCASION_LABELS } from "@/lib/types";

function parseGiftUrl(raw: string): string | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const https = safeHttpsUrl(trimmed);
  if (!https) {
    throw new Error("Gift links must start with https://");
  }
  return https;
}

export default function ManageListPage() {
  const params = useParams<{ id: string }>();
  const {
    lists,
    ready,
    refresh,
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
  const [quantityInput, setQuantityInput] = useState("");
  const [quantityNeededInput, setQuantityNeededInput] = useState("");
  const [priorityInput, setPriorityInput] = useState<"high" | "medium" | "low" | "">("");
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editQuantity, setEditQuantity] = useState("");
  const [editQuantityNeeded, setEditQuantityNeeded] = useState("");
  const [editPriority, setEditPriority] = useState<"high" | "medium" | "low" | "">("");
  const [addressDraft, setAddressDraft] = useState("");
  const [supportUrlDraft, setSupportUrlDraft] = useState("");
  const [supportLabelDraft, setSupportLabelDraft] = useState("Support me");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaDate, setMetaDate] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    setAddressDraft(list?.recipientAddress ?? "");
    setSupportUrlDraft(list?.supportUrl ?? "");
    setSupportLabelDraft(list?.supportLabel ?? "Support me");
    setMetaTitle(list?.title ?? "");
    setMetaDescription(list?.description ?? "");
    setMetaDate(list?.eventDate ?? "");
    setTags(list?.tags ?? []);
  }, [
    list?.id,
    list?.recipientAddress,
    list?.supportUrl,
    list?.supportLabel,
    list?.title,
    list?.description,
    list?.eventDate,
    list?.tags,
  ]);

  // Pick up claims made on other phones without a full page reload.
  useEffect(() => {
    if (!ready) return;
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    const poll = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 15_000);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      window.clearInterval(poll);
    };
  }, [ready, params.id, refresh]);

  if (!ready) {
    return (
      <div className="panel p-8 text-center text-ink-soft">Opening list…</div>
    );
  }

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
    setEditQuantity(item.quantity != null ? String(item.quantity) : "");
    setEditQuantityNeeded(item.quantityNeeded != null ? String(item.quantityNeeded) : "");
    setEditPriority(item.priority ?? "");
  }

  async function saveEdit() {
    if (!list || !editingId || !editTitle.trim()) return;
    setBusy(true);
    try {
      let url: string | undefined;
      try {
        url = parseGiftUrl(editUrl);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Invalid URL");
        return;
      }
      await updateItem(list.id, editingId, {
        title: editTitle.trim().slice(0, FIELD_LIMITS.itemTitle),
        price: editPrice ? Number(editPrice) : undefined,
        url,
        notes: editNotes.trim().slice(0, FIELD_LIMITS.notes) || undefined,
        quantity: editQuantity ? Number(editQuantity) : undefined,
        quantityNeeded: editQuantityNeeded ? Number(editQuantityNeeded) : undefined,
        priority: editPriority || undefined,
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
      let url: string | undefined;
      try {
        url = parseGiftUrl(urlInput);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Invalid URL");
        return;
      }
      await addItem(list.id, {
        title: titleInput.trim().slice(0, FIELD_LIMITS.itemTitle),
        price: priceInput ? Number(priceInput) : undefined,
        url,
        notes: notesInput.trim().slice(0, FIELD_LIMITS.notes) || undefined,
        quantity: quantityInput ? Number(quantityInput) : undefined,
        quantityNeeded: quantityNeededInput ? Number(quantityNeededInput) : undefined,
        priority: priorityInput || undefined,
      });
      setTitleInput("");
      setPriceInput("");
      setUrlInput("");
      setNotesInput("");
      setQuantityInput("");
      setQuantityNeededInput("");
      setPriorityInput("");
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
    if (!list.recipientAddress?.trim() && !addressDraft.trim()) {
      const go = confirm(
        "No ship-to address saved. Friends who choose “ship to you” won’t get an address. Publish anyway?",
      );
      if (!go) return;
    }
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
        tags,
      });
      toast.success("List details saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  async function saveSupportLink() {
    if (!list) return;
    const raw = supportUrlDraft.trim();
    if (!raw) {
      try {
        await updateList(list.id, {
          supportUrl: undefined,
          supportLabel: undefined,
        });
        toast.success("Support link cleared");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not save");
      }
      return;
    }
    const tip = safeSupportUrl(raw) ?? paypalMeUrl(raw);
    if (!tip) {
      toast.error(
        "Use a valid https PayPal.me, PayPal, Ko-fi, or Buy Me a Coffee link.",
      );
      return;
    }
    try {
      await updateList(list.id, {
        supportUrl: tip,
        supportLabel: supportLabelDraft.trim() || "Support with PayPal",
      });
      setSupportUrlDraft(tip);
      toast.success("Support link saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    }
  }

  const sharePanel = (
    <div className="panel border-2 border-coral/30 p-5">
      <p className="font-display text-xl text-ink">Share</p>
      <p className="mt-1 text-sm text-ink-soft">
        Finalize, then send this link. Friends mark gifts purchased privately.
      </p>
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
          <div className="wish-hero">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="wish-hero-kicker">
                  {OCCASION_EMOJI[list.occasion]} {OCCASION_LABELS[list.occasion]}
                  {list.published ? " · Shared" : " · Draft"}
                </p>
                <h1 className="wish-hero-title">{list.title}</h1>
                {list.description && (
                  <p className="wish-hero-meta">{list.description}</p>
                )}
              </div>
              <Countdown eventDate={list.eventDate} />
            </div>
          </div>

          <details className="panel p-5">
            <summary className="cursor-pointer font-display text-xl text-ink">
              Edit list details
            </summary>
            <div className="mt-4 space-y-3">
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
              <div>
                <label className="label">Tags</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full bg-leaf/10 px-3 py-1 text-sm font-semibold text-leaf"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => setTags(tags.filter((t) => t !== tag))}
                        className="text-leaf hover:text-coral-deep"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="mt-2 flex gap-2">
                  <input
                    className="field flex-1"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="Add tag..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && tagsInput.trim()) {
                        e.preventDefault();
                        if (!tags.includes(tagsInput.trim())) {
                          setTags([...tags, tagsInput.trim()]);
                        }
                        setTagsInput("");
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      if (tagsInput.trim() && !tags.includes(tagsInput.trim())) {
                        setTags([...tags, tagsInput.trim()]);
                        setTagsInput("");
                      }
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={busy}
                onClick={async () => {
                  await saveMeta();
                  await updateList(list.id, { tags });
                  toast.success("Tags saved");
                }}
              >
                Save details
              </button>
            </div>
          </details>

          {list.items.length === 0 ? (
            <div className="py-10 text-center">
              <p className="font-display text-2xl text-ink">No gifts yet</p>
              <p className="mt-1 text-sm text-ink-soft">
                Add your first idea below.
              </p>
            </div>
          ) : (
            <ul className="wish-list stagger">
              {list.items.map((item) => (
                <li key={item.id}>
                  {editingId === item.id ? (
                    <div className="space-y-3 py-4">
                      <input
                        className="field"
                        value={editTitle}
                        maxLength={FIELD_LIMITS.itemTitle}
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
                          placeholder="https:// product link"
                          value={editUrl}
                          maxLength={FIELD_LIMITS.url}
                          onChange={(e) => setEditUrl(e.target.value)}
                        />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <input
                          className="field"
                          type="number"
                          min="1"
                          placeholder="Quantity"
                          value={editQuantity}
                          onChange={(e) => setEditQuantity(e.target.value)}
                        />
                        <input
                          className="field"
                          type="number"
                          min="1"
                          placeholder="Needed"
                          value={editQuantityNeeded}
                          onChange={(e) => setEditQuantityNeeded(e.target.value)}
                        />
                        <select
                          className="field"
                          value={editPriority}
                          onChange={(e) => setEditPriority(e.target.value as "high" | "medium" | "low" | "")}
                        >
                          <option value="">Priority</option>
                          <option value="high">🔴 High</option>
                          <option value="medium">🟡 Medium</option>
                          <option value="low">🟢 Low</option>
                        </select>
                      </div>
                      <input
                        className="field"
                        placeholder="Notes"
                        value={editNotes}
                        maxLength={FIELD_LIMITS.notes}
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
                    <WishItem
                      item={item}
                      footer={
                        (() => {
                          const buy = item.url ? safeHttpUrl(item.url) : null;
                          return buy && !item.purchased ? (
                            <a
                              href={buy}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="wish-item-link"
                            >
                              View product
                            </a>
                          ) : null;
                        })()
                      }
                      actions={
                        !item.purchased ? (
                          <>
                            <button
                              type="button"
                              className="btn btn-ghost !px-2 !py-1 text-sm"
                              onClick={() => startEdit(item)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost !px-2 !py-1 text-sm text-coral-deep"
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
                          </>
                        ) : undefined
                      }
                    />
                  )}
                </li>
              ))}
            </ul>
          )}

          <AiGiftRecommend
            occasion={list.occasion}
            onUse={(g) => {
              setTitleInput(g.title);
              setNotesInput(g.short_description);
              setPriceInput(String(g.estimated_price));
              // Prefer https search landing; user pastes real product URL
              setUrlInput(
                `https://www.google.com/search?q=${encodeURIComponent(g.search_keyword)}`,
              );
            }}
          />

          <SuggestGiftsPanel
            occasion={list.occasion}
            onUse={(s) => {
              setTitleInput(s.title);
              setNotesInput(s.notes ?? s.why ?? "");
              setPriceInput(
                s.priceHint != null ? String(s.priceHint) : "",
              );
            }}
          />

          <form onSubmit={onAdd} className="panel space-y-3 p-5">
            <p className="font-display text-xl text-ink">Add a gift idea</p>
            <input
              className="field"
              placeholder="Title"
              value={titleInput}
              maxLength={FIELD_LIMITS.itemTitle}
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
                placeholder="https:// product link"
                value={urlInput}
                maxLength={FIELD_LIMITS.url}
                onChange={(e) => setUrlInput(e.target.value)}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <input
                className="field"
                type="number"
                min="1"
                placeholder="Quantity"
                value={quantityInput}
                onChange={(e) => setQuantityInput(e.target.value)}
              />
              <input
                className="field"
                type="number"
                min="1"
                placeholder="Needed"
                value={quantityNeededInput}
                onChange={(e) => setQuantityNeededInput(e.target.value)}
              />
              <select
                className="field"
                value={priorityInput}
                onChange={(e) => setPriorityInput(e.target.value as "high" | "medium" | "low" | "")}
              >
                <option value="">Priority</option>
                <option value="high">🔴 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </select>
            </div>
            <input
              className="field"
              placeholder="Notes"
              value={notesInput}
              maxLength={FIELD_LIMITS.notes}
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
              maxLength={FIELD_LIMITS.recipientAddress}
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
              PayPal.me recommended. Tips process on PayPal, not Givy.
            </p>
            <label className="label mt-3" htmlFor="supportUrl">
              PayPal.me or tip link
            </label>
            <input
              id="supportUrl"
              className="field"
              type="url"
              value={supportUrlDraft}
              onChange={(e) => setSupportUrlDraft(e.target.value)}
              placeholder="https://www.paypal.com/paypalme/yourname"
            />
            <label className="label mt-3" htmlFor="supportLabel">
              Button text
            </label>
            <input
              id="supportLabel"
              className="field"
              value={supportLabelDraft}
              onChange={(e) => setSupportLabelDraft(e.target.value)}
              placeholder="Support with PayPal"
            />
            <button
              type="button"
              className="btn btn-secondary mt-3"
              disabled={busy}
              onClick={() => {
                void saveSupportLink();
              }}
            >
              Save support link
            </button>
          </div>

          <button
            type="button"
            className="btn btn-ghost text-sm text-coral-deep"
            onClick={() => {
              if (!confirm("Delete this Givy?")) return;
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
            maxLength={FIELD_LIMITS.recipientAddress}
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
          <p className="mt-1 text-sm text-ink-soft">
            PayPal.me recommended. Tips process on PayPal, not Givy.
          </p>
          <input
            className="field mt-3"
            type="url"
            value={supportUrlDraft}
            onChange={(e) => setSupportUrlDraft(e.target.value)}
            placeholder="https://www.paypal.com/paypalme/yourname"
          />
          <input
            className="field mt-3"
            value={supportLabelDraft}
            onChange={(e) => setSupportLabelDraft(e.target.value)}
            placeholder="Support with PayPal"
          />
          <button
            type="button"
            className="btn btn-secondary mt-3"
            onClick={() => {
              void saveSupportLink();
            }}
          >
            Save support link
          </button>
        </div>
        <button
          type="button"
          className="btn btn-ghost text-sm text-coral-deep"
          onClick={() => {
            if (!confirm("Delete this Givy?")) return;
            void deleteList(list.id).then(() => router.push("/app/lists"));
          }}
        >
          Delete list
        </button>
      </div>
    </div>
  );
}
