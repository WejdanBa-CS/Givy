"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  fetchClaimNotifications,
  markClaimNotificationsRead,
  type ClaimNotification,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useGivy } from "@/lib/givy-context";
import { formatShortDate } from "@/lib/store";

/** Polls for new claim alerts and toasts the owner when something is taken. */
export function ClaimNotificationWatcher() {
  const router = useRouter();
  const { user, cloud, localSession, ready } = useGivy();
  const seen = useRef<Set<string>>(new Set());
  const [items, setItems] = useState<ClaimNotification[]>([]);

  useEffect(() => {
    if (!ready || !cloud || localSession || !user) return;

    let cancelled = false;

    async function pull(announce: boolean) {
      try {
        const rows = await fetchClaimNotifications();
        if (cancelled) return;
        setItems(rows);
        if (announce) {
          const fresh = rows.filter((r) => !r.read && !seen.current.has(r.id));
          for (const n of fresh.slice(0, 3)) {
            toast.success("Someone claimed a gift", {
              description: `“${n.itemTitle}” on ${n.listTitle} is now taken.`,
              action: {
                label: "View",
                onClick: () => {
                  router.push(`/app/${n.listId}`);
                },
              },
            });
            seen.current.add(n.id);
          }
        } else {
          for (const r of rows) seen.current.add(r.id);
        }
      } catch {
        /* table may not exist until migration 009 */
      }
    }

    void pull(false);
    const id = window.setInterval(() => void pull(true), 20_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") void pull(true);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [ready, cloud, localSession, router, user]);

  const unread = items.filter((i) => !i.read);

  if (!user || localSession || unread.length === 0) return null;

  return (
    <div className="rounded-2xl border border-leaf/30 bg-leaf/10 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-leaf">
            New claims
          </p>
          <p className="mt-1 text-sm font-semibold text-ink">
            {unread.length === 1
              ? "Someone marked a gift as taken"
              : `${unread.length} gifts were marked as taken`}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-auto px-1 py-1 text-xs text-coral-deep"
          onClick={() => {
            void markClaimNotificationsRead(unread.map((u) => u.id)).then(() =>
              setItems((prev) =>
                prev.map((p) =>
                  unread.some((u) => u.id === p.id)
                    ? { ...p, read: true }
                    : p,
                ),
              ),
            );
          }}
        >
          Mark read
        </Button>
      </div>
      <ul className="mt-3 space-y-2">
        {unread.slice(0, 5).map((n) => (
          <li key={n.id} className="text-sm text-ink">
            <Link href={`/app/${n.listId}`} className="font-semibold underline-offset-2 hover:underline">
              “{n.itemTitle}”
            </Link>
            <span className="text-ink-soft">
              {" "}
              on {n.listTitle} · {formatShortDate(n.at)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
