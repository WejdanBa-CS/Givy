"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { Countdown } from "@/components/Countdown";
import { GiftGlyph } from "@/components/GiftGlyph";
import { useGivy } from "@/lib/givy-context";
import { formatMoney } from "@/lib/store";
import { OCCASION_EMOJI, OCCASION_LABELS } from "@/lib/types";

export default function ManageListPage() {
  const params = useParams<{ id: string }>();
  const { lists, addItem, removeItem, publishList, deleteList, updateList } = useGivy();
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

  function onAdd(e: FormEvent) {
    e.preventDefault();
    if (!titleInput.trim()) return;
    addItem(list!.id, {
      title: titleInput.trim(),
      price: priceInput ? Number(priceInput) : undefined,
      url: urlInput.trim() || undefined,
      notes: notesInput.trim() || undefined,
    });
    setTitleInput("");
    setPriceInput("");
    setUrlInput("");
    setNotesInput("");
  }

  async function copyShare() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="space-y-4">
      <Link href="/app/lists" className="text-sm font-semibold text-ink-soft">
        ← Lists
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="animate-rise">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
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

          <ul className="stagger mt-6 space-y-3">
            {list.items.map((item) => (
              <li
                key={item.id}
                className={`panel flex items-start gap-3 p-4 ${
                  item.purchased ? "gift-claimed" : ""
                }`}
              >
                <GiftGlyph hint={item.imageHint} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="gift-title font-semibold text-ink">{item.title}</p>
                    {item.purchased ? (
                      <p className="text-sm font-semibold text-ink-soft">Claimed</p>
                    ) : (
                      <span className="price-badge">{formatMoney(item.price)}</span>
                    )}
                  </div>
                  {item.notes && (
                    <p className="mt-1 text-sm text-ink-soft">{item.notes}</p>
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
                  <button
                    type="button"
                    className="btn btn-ghost text-sm"
                    onClick={() => removeItem(list.id, item.id)}
                  >
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>

          <form onSubmit={onAdd} className="panel mt-5 space-y-3 p-5">
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
            <button type="submit" className="btn btn-secondary">
              Add to list
            </button>
          </form>
        </section>

        <aside className="animate-rise space-y-4 lg:sticky lg:top-6 lg:self-start">
          <div className="panel p-5">
            <p className="font-display text-xl text-ink">Share</p>
            <p className="mt-1 text-sm text-ink-soft">
              Finalize and send the link. Claimed gifts gray out — buyer stays private.
            </p>
            <div className="mt-4 rounded-2xl border border-line bg-paper/80 p-3 text-sm break-all text-ink-soft">
              {shareUrl}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {!list.published ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => publishList(list.id)}
                >
                  Finalize & share
                </button>
              ) : (
                <button type="button" className="btn btn-primary" onClick={copyShare}>
                  {copied ? "Copied" : "Copy link"}
                </button>
              )}
              <Link href={`/g/${list.shareCode}`} className="btn btn-secondary">
                Preview
              </Link>
            </div>
            {list.published && (
              <p className="mt-3 text-xs font-semibold text-leaf">Live for friends</p>
            )}
          </div>

          <div className="panel p-5">
            <p className="font-display text-xl text-ink">Shipping address</p>
            <p className="mt-1 text-sm text-ink-soft">
              Used when a friend ships the gift straight to you.
            </p>
            <textarea
              className="field mt-3 min-h-24"
              value={list.recipientAddress ?? ""}
              onChange={(e) =>
                updateList(list.id, { recipientAddress: e.target.value })
              }
              placeholder="123 Gift Lane…"
            />
          </div>

          <button
            type="button"
            className="btn btn-ghost text-sm text-coral-deep"
            onClick={() => {
              if (confirm("Delete this Givy?")) {
                deleteList(list.id);
                router.push("/app/lists");
              }
            }}
          >
            Delete list
          </button>
        </aside>
      </div>
    </div>
  );
}
