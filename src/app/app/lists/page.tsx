"use client";

import Link from "next/link";
import { Countdown } from "@/components/Countdown";
import { OccasionBadge } from "@/components/OccasionBadge";
import { useGivy } from "@/lib/givy-context";
import { formatMoney } from "@/lib/store";
import { OccasionIcon } from "@/components/OccasionIcon";
import { CopyPlus, Plus, Search } from "lucide-react";
import { OCCASION_LABELS, type Occasion } from "@/lib/types";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

const filters: Array<"all" | Occasion> = [
  "all",
  "birthday",
  "holiday",
  "wedding",
  "baby",
  "graduation",
  "creator",
  "other",
];

export default function ListsPage() {
  const { lists, searchLists, duplicateList, getAllTags } = useGivy();
  const [filter, setFilter] = useState<(typeof filters)[number]>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  const allTags = getAllTags();

  const filtered = useMemo(() => {
    let result = filter === "all" ? lists : lists.filter((l) => l.occasion === filter);
    
    if (searchQuery.trim()) {
      result = searchLists(searchQuery).filter((l) => 
        filter === "all" || l.occasion === filter
      );
    }
    
    if (selectedTag) {
      result = result.filter((l) => l.tags?.includes(selectedTag));
    }
    
    return result;
  }, [lists, filter, searchQuery, selectedTag, searchLists]);

  const handleDuplicate = async (listId: string, listTitle: string) => {
    setDuplicatingId(listId);
    try {
      await duplicateList(listId, `${listTitle} (copy)`);
    } catch (error) {
      console.error("Failed to duplicate list:", error);
    } finally {
      setDuplicatingId(null);
    }
  };

  return (
    <div className="animate-rise space-y-5 lg:space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-[2rem] font-semibold leading-tight tracking-[-0.025em] text-ink sm:text-4xl lg:text-5xl">
            Lists
          </h1>
          <p className="mt-1 text-sm text-ink-soft lg:text-base">
            Every occasion, in one place.
          </p>
        </div>
        <Link href="/app/create" className="btn btn-primary !min-h-10 shrink-0 !px-4 text-sm">
          <Plus aria-hidden size={16} strokeWidth={2.25} />
          New list
        </Link>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Search
            aria-hidden
            size={16}
            strokeWidth={1.75}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft"
          />
          <input
            type="search"
            placeholder="Search lists"
            aria-label="Search lists"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="field !pl-10"
          />
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedTag("")}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
                !selectedTag
                  ? "bg-coral text-white"
                  : "border border-line bg-paper text-ink-soft"
              }`}
            >
              All tags
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(tag)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
                  selectedTag === tag
                    ? "bg-coral text-white"
                    : "border border-line bg-paper text-ink-soft"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="-mx-1 flex gap-2 overflow-x-auto overscroll-x-contain px-1 pb-1 lg:flex-wrap lg:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            className={`h-8 shrink-0 snap-start rounded-full px-3.5 text-[13px] font-medium transition ${
              filter === f
                ? "bg-ink text-mist"
                : "border border-line/80 bg-paper text-ink-soft hover:text-ink"
            }`}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? (
              "All"
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <OccasionIcon occasion={f} size={12} />
                {OCCASION_LABELS[f]}
              </span>
            )}
          </button>
        ))}
      </div>

      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-soft">
        {filtered.length} {filtered.length === 1 ? "list" : "lists"}
      </p>

      <div className="stagger flex flex-col gap-3">
        {filtered.map((list) => {
          const claimed = list.items.filter((i) => i.purchased).length;
          const total = list.items.length;
          const pct = total > 0 ? Math.round((claimed / total) * 100) : 0;
          return (
            <div
              key={list.id}
              className="panel relative p-5 transition-shadow duration-300 hover:shadow-[var(--shadow-raised)]"
            >
              <Link href={`/app/${list.id}`} className="block">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <OccasionBadge
                      occasion={list.occasion}
                      suffix={list.published ? "Shared" : "Draft"}
                    />
                    <h2 className="mt-2.5 break-words font-display text-xl font-semibold tracking-[-0.015em] text-ink sm:text-2xl">
                      {list.title}
                    </h2>
                  </div>
                  <Countdown eventDate={list.eventDate} />
                </div>
                <p className="mt-0.5 text-sm text-ink-soft">
                  {total} items · {claimed} claimed
                  {list.items[0]?.price != null
                    ? ` · from ${formatMoney(
                        Math.min(...list.items.map((i) => i.price ?? Infinity)),
                      )}`
                    : ""}
                </p>
                {list.tags && list.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {list.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-block rounded-full bg-mist-deep px-2 py-0.5 text-xs font-semibold text-ink-soft"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                {total > 0 && (
                  <div className="mt-4">
                    <div className="mb-1.5 flex justify-between text-xs text-ink-soft">
                      <span>
                        {claimed} of {total} claimed
                      </span>
                      <span className="tabular-nums">{pct}%</span>
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-mist-deep">
                      <div
                        className="h-full rounded-full bg-leaf transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )}
              </Link>
              <div className="mt-4 flex justify-end border-t border-line/70 pt-3">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.preventDefault();
                    handleDuplicate(list.id, list.title);
                  }}
                  disabled={duplicatingId === list.id}
                  className="!h-8 !px-2"
                >
                  <CopyPlus aria-hidden size={15} strokeWidth={1.75} />
                  {duplicatingId === list.id ? "Duplicating…" : "Duplicate"}
                </Button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="panel p-8 text-center">
            <p className="font-display text-2xl font-semibold">
              {lists.length === 0 ? "Nothing here yet" : "No lists in this filter"}
            </p>
            <p className="mt-2 text-sm text-ink-soft">
              {lists.length === 0
                ? "Create your first gift list to get started."
                : "Try another occasion, or create a new list."}
            </p>
            <Link href="/app/create" className="btn btn-primary mt-4">
              {lists.length === 0 ? "Create a Givy" : "New Givy"}
            </Link>
          </div>
        )}
        {filtered.length > 0 && (
          <Link
            href="/app/create"
            className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-dashed border-line text-sm font-medium text-ink-soft transition hover:border-ink/25 hover:text-ink"
          >
            <Plus aria-hidden size={15} strokeWidth={2} />
            New list
          </Link>
        )}
      </div>
    </div>
  );
}
