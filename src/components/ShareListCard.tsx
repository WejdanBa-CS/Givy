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
    <div className="panel border-2 border-coral/30 p-5">
      <p className="font-display text-xl text-ink">Share</p>
      <p className="mt-1 text-sm text-ink-soft">
        Finalize, then send this link. Friends mark gifts purchased privately.
      </p>
      <div className="mt-4 break-all rounded-2xl border border-line bg-paper/80 p-3 text-sm text-ink-soft">
        {shareUrl}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {!list.published ? (
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy}
            onClick={onPublish}
          >
            Finalize & share
          </button>
        ) : (
          <>
            <button type="button" className="btn btn-primary" onClick={onCopy}>
              {copied ? "Copied" : "Copy link"}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onShare}>
              Share…
            </button>
          </>
        )}
        <Link
          href={`/g/${list.shareCode}`}
          className="btn btn-secondary"
          onClick={(event) => {
            if (!list.published) {
              event.preventDefault();
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
}
