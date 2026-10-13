"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AddGiftForm, type GiftDraft } from "@/components/AddGiftForm";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Countdown } from "@/components/Countdown";
import { EditGiftDialog } from "@/components/EditGiftDialog";
import { ListSettingsPanel } from "@/components/ListSettingsPanel";
import { OccasionBadge } from "@/components/OccasionBadge";
import { ShareListCard } from "@/components/ShareListCard";
import { SuggestGiftsPanel } from "@/components/SuggestGiftsPanel";
import { WishItem } from "@/components/WishItem";
import { useGivy } from "@/lib/givy-context";
import { safeHttpUrl } from "@/lib/security";
import type { GiftItem, GivyList } from "@/lib/types";

export default function ManageListPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
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
  const list = useMemo(
    () => lists.find((candidate) => candidate.id === params.id) ?? null,
    [lists, params.id],
  );
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editingItem, setEditingItem] = useState<GiftItem | null>(null);
  const [removeItemTarget, setRemoveItemTarget] = useState<GiftItem | null>(null);
  const [publishConfirmationOpen, setPublishConfirmationOpen] = useState(false);
  const [giftPrefill, setGiftPrefill] = useState<Partial<GiftDraft> | null>(null);

  useEffect(() => {
    if (!ready) return;
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", refreshWhenVisible);
    window.addEventListener("focus", refreshWhenVisible);
    const poll = window.setInterval(refreshWhenVisible, 15_000);
    return () => {
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      window.removeEventListener("focus", refreshWhenVisible);
      window.clearInterval(poll);
    };
  }, [ready, refresh]);

  if (!ready) {
    return <div className="panel p-8 text-center text-ink-soft">Opening list…</div>;
  }
  if (!list) {
    return (
      <div className="panel p-8 text-center">
        <p className="font-display text-2xl">List not found</p>
        <Link href="/app/lists" className="btn btn-primary mt-4">Back to lists</Link>
      </div>
    );
  }

  const managedList: GivyList = list;

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/g/${managedList.shareCode}`
      : `/g/${managedList.shareCode}`;

  async function copyShare() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied");
      window.setTimeout(() => setCopied(false), 1_600);
    } catch {
      toast.error("Could not copy. Select the link and copy manually.");
    }
  }

  async function shareNatively() {
    if (!navigator.share) {
      await copyShare();
      return;
    }
    try {
      await navigator.share({
        title: managedList.title,
        text: `Gift ideas for ${managedList.title}`,
        url: shareUrl,
      });
    } catch {
      // A dismissed platform share sheet is not an application error.
    }
  }

  async function publish() {
    if (!managedList.recipientAddress?.trim()) {
      setPublishConfirmationOpen(true);
      return;
    }
    await completePublish();
  }

  async function completePublish() {
    setPublishConfirmationOpen(false);
    setBusy(true);
    try {
      await publishList(managedList.id);
      toast.success("List is live");
      await copyShare();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not publish");
    } finally {
      setBusy(false);
    }
  }

  async function addGift(item: Omit<GiftItem, "id" | "purchased" | "purchasedAt" | "claimedByMe">) {
    setBusy(true);
    try {
      await addItem(managedList.id, item);
      setGiftPrefill(null);
    } finally {
      setBusy(false);
    }
  }

  async function saveItem(
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
  ) {
    if (!editingItem) return;
    setBusy(true);
    try {
      await updateItem(managedList.id, editingItem.id, patch);
    } finally {
      setBusy(false);
    }
  }

  async function deleteCurrentList() {
    setBusy(true);
    try {
      await deleteList(managedList.id);
      toast.success("List deleted");
      router.push("/app/lists");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete list");
    } finally {
      setBusy(false);
    }
  }

  async function removeGift() {
    if (!removeItemTarget) return;
    setBusy(true);
    try {
      await removeItem(managedList.id, removeItemTarget.id);
      toast.success("Removed");
      setRemoveItemTarget(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remove gift");
    } finally {
      setBusy(false);
    }
  }

  const shareCard = (
    <ShareListCard
      list={list}
      shareUrl={shareUrl}
      busy={busy}
      copied={copied}
      onPublish={() => void publish()}
      onCopy={() => void copyShare()}
      onShare={() => void shareNatively()}
    />
  );
  const settingsPanel = (
    <ListSettingsPanel
      list={list}
      busy={busy}
      onUpdate={async (patch: Partial<GivyList>) => {
        setBusy(true);
        try {
          await updateList(managedList.id, patch);
        } finally {
          setBusy(false);
        }
      }}
      onDelete={deleteCurrentList}
    />
  );

  return (
    <div className="space-y-4">
      <Link href="/app/lists" className="text-sm font-semibold text-ink-soft">← Lists</Link>
      <div className="lg:hidden">{shareCard}</div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="animate-rise space-y-4">
          <div className="wish-hero space-y-4">
            <div className="min-w-0">
              <OccasionBadge
                occasion={managedList.occasion}
                suffix={managedList.published ? "Shared" : "Draft"}
              />
              <h1 className="wish-hero-title">{managedList.title}</h1>
              {managedList.description && (
                <p className="wish-hero-meta">{managedList.description}</p>
              )}
            </div>
            <div className="panel p-5">
              <p className="mb-4 text-xs font-black uppercase tracking-widest text-ink-soft">
                Countdown
              </p>
              <Countdown eventDate={managedList.eventDate} compact={false} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  label: "Total",
                  value: managedList.items.length,
                  color: "text-ink",
                },
                {
                  label: "Available",
                  value: managedList.items.filter((i) => !i.purchased).length,
                  color: "text-coral",
                },
                {
                  label: "Claimed",
                  value: managedList.items.filter((i) => i.purchased).length,
                  color: "text-leaf",
                },
              ].map((s) => (
                <div key={s.label} className="panel p-3.5">
                  <p className={`font-display text-xl font-black ${s.color}`}>{s.value}</p>
                  <p className="text-xs font-semibold text-ink-soft">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {managedList.items.length === 0 ? (
            <div className="py-10 text-center">
              <p className="font-display text-2xl font-black text-ink">No gifts yet</p>
              <p className="mt-1 text-sm text-ink-soft">Add your first idea below.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs font-black uppercase tracking-widest text-ink-soft">Gift Ideas</p>
              <ul className="wish-list stagger">
                {managedList.items.map((item) => {
                  const buyUrl = item.url ? safeHttpUrl(item.url) : null;
                  return (
                    <li key={item.id}>
                      <WishItem
                        item={item}
                        footer={buyUrl && !item.purchased ? <a href={buyUrl} target="_blank" rel="noopener noreferrer" className="wish-item-link">View product</a> : null}
                        actions={!item.purchased ? (
                          <>
                            <button type="button" className="btn btn-ghost !px-2 !py-1 text-xs" onClick={() => setEditingItem(item)}>Edit</button>
                            <button type="button" className="btn btn-ghost !px-2 !py-1 text-xs text-coral" onClick={() => setRemoveItemTarget(item)}>Remove</button>
                          </>
                        ) : undefined}
                      />
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <SuggestGiftsPanel
            occasion={managedList.occasion}
            onUse={(suggestion) => setGiftPrefill({
              title: suggestion.title,
              notes: suggestion.notes ?? suggestion.why ?? "",
              price: suggestion.priceHint,
            })}
          />
          <AddGiftForm busy={busy} prefill={giftPrefill} onAdd={addGift} />
        </section>

        <aside className="hidden animate-rise space-y-4 lg:sticky lg:top-6 lg:block lg:self-start">
          {shareCard}
          {settingsPanel}
        </aside>
      </div>

      <div className="space-y-4 lg:hidden">{settingsPanel}</div>

      <EditGiftDialog item={editingItem} busy={busy} onOpenChange={(open) => { if (!open) setEditingItem(null); }} onSave={saveItem} />
      <ConfirmDialog
        open={Boolean(removeItemTarget)}
        title="Remove this gift?"
        description={removeItemTarget ? `Remove “${removeItemTarget.title}” from this list?` : ""}
        confirmLabel="Remove gift"
        destructive
        busy={busy}
        onOpenChange={(open) => { if (!open) setRemoveItemTarget(null); }}
        onConfirm={() => void removeGift()}
      />
      <ConfirmDialog
        open={publishConfirmationOpen}
        title="Publish without a shipping address?"
        description="Friends who choose “ship to you” will not receive an address. You can add one later in list settings."
        confirmLabel="Publish anyway"
        busy={busy}
        onOpenChange={setPublishConfirmationOpen}
        onConfirm={() => void completePublish()}
      />
    </div>
  );
}
