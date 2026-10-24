import { Check, Copy, Eye, Share2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { GivyList } from "@/lib/types";

type ShareListCardProps = {
  list: GivyList;
  shareUrl: string;
  busy?: boolean;
  copied: boolean;
  onPublish: () => void;
  onCopy: () => void;
  onShare: () => void;
};

export function ShareListCard({
  list,
  shareUrl,
  busy = false,
  copied,
  onPublish,
  onCopy,
  onShare,
}: ShareListCardProps) {
  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-xl font-semibold tracking-[-0.015em] text-ink">Share</p>
        {list.published ? (
          <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-leaf/10 px-2.5 text-[11px] font-semibold text-leaf">
            <span className="h-1.5 w-1.5 rounded-full bg-leaf" aria-hidden />
            Live for friends
          </span>
        ) : (
          <span className="inline-flex h-6 items-center rounded-full bg-mist-deep px-2.5 text-[11px] font-semibold text-ink-soft">
            Draft
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-ink-soft">
        {list.published
          ? "Send this link. Friends claim gifts privately."
          : "Finalize the list, then send one link to friends."}
      </p>

      <div className="mt-4 flex items-center gap-2 rounded-xl border border-line bg-mist/50 p-1.5 pl-3.5">
        <span className="min-w-0 flex-1 truncate text-sm text-ink-soft">{shareUrl}</span>
        {list.published ? (
          <button
            type="button"
            className="btn btn-primary !min-h-9 shrink-0 !px-3.5 text-sm"
            onClick={onCopy}
          >
            {copied ? (
              <Check aria-hidden size={15} strokeWidth={2.25} />
            ) : (
              <Copy aria-hidden size={15} strokeWidth={2} />
            )}
            {copied ? "Copied" : "Copy"}
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary !min-h-9 shrink-0 !px-3.5 text-sm"
            disabled={busy}
            onClick={onPublish}
          >
            Finalize & share
          </button>
        )}
      </div>

      <div className={`mt-2 grid gap-2 ${list.published ? "grid-cols-2" : "grid-cols-1"}`}>
        {list.published && (
          <button type="button" className="btn btn-secondary !min-h-10 text-sm" onClick={onShare}>
            <Share2 aria-hidden size={15} strokeWidth={1.75} />
            Share…
          </button>
        )}
        <Link
          href={`/g/${list.shareCode}`}
          className="btn btn-secondary !min-h-10 text-sm"
          onClick={(event) => {
            if (!list.published) {
              event.preventDefault();
              toast.message("Finalize the list first so friends can open it.");
            }
          }}
        >
          <Eye aria-hidden size={15} strokeWidth={1.75} />
          Preview
        </Link>
      </div>
    </div>
  );
}
