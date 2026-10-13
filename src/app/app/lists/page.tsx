"use client";

import Link from "next/link";
import { Countdown } from "@/components/Countdown";
import { OccasionBadge } from "@/components/OccasionBadge";
import { useGivy } from "@/lib/givy-context";
import { formatMoney } from "@/lib/store";
import { OCCASION_EMOJI, OCCASION_LABELS, type Occasion } from "@/lib/types";
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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-black tracking-tight text-ink sm:text-4xl lg:text-5xl">
            Lists
          </h1>
          <p className="mt-1 text-sm font-semibold text-ink-soft lg:text-base">
            Birthdays, holidays, weddings: all your Givies.
          </p>
        </div>
        <Link href="/app/create" className="btn btn-primary shrink-0">
          New Givy
        </Link>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Search lists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="field !rounded-2xl !py-2.5"
          />
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedTag("")}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${
                !selectedTag
                  ? "bg-coral text-white"
                  : "border-2 border-line bg-paper text-ink-soft"
              }`}
            >
              All tags
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(tag)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${
                  selectedTag === tag
                    ? "bg-coral text-white"
                    : "border-2 border-line bg-paper text-ink-soft"
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
            className={`shrink-0 snap-start rounded-full px-3 py-1.5 text-xs font-bold ${
              filter === f
                ? "bg-ink text-white"
                : "border-2 border-line bg-paper text-ink-soft"
            }`}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "All" : `${OCCASION_EMOJI[f]} ${OCCASION_LABELS[f]}`}
          </button>
        ))}
      </div>

      <p className="text-xs font-black uppercase tracking-widest text-ink-soft">Your Lists</p>

      <div className="stagger flex flex-col gap-3">
        {filtered.map((list) => {
          const claimed = list.items.filter((i) => i.purchased).length;
          const total = list.items.length;
          const pct = total > 0 ? Math.round((claimed / total) * 100) : 0;
          return (
            <div
              key={list.id}
              className="panel relative p-5 transition-all hover:border-coral/50 hover:shadow-md"
            >
              <Link href={`/app/${list.id}`} className="block">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <OccasionBadge
                    occasion={list.occasion}
                    suffix={list.published ? "Shared" : "Draft"}
                  />
                  <Countdown eventDate={list.eventDate} />
                </div>
                <h2 className="break-words font-display text-xl font-black text-ink sm:text-2xl">
                  {list.title}
                </h2>
                <p className="mt-1 text-sm text-ink-soft">
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
                    <div className="mb-1.5 flex justify-between text-xs font-semibold text-ink-soft">
                      <span>
                        {claimed} of {total} claimed
                      </span>
                      <span className="text-leaf">{pct}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-mist-deep">
                      <div
                        className="h-full rounded-full bg-coral transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )}
              </Link>
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={(e) => {
                    e.preventDefault();
                    handleDuplicate(list.id, list.title);
                  }}
                  disabled={duplicatingId === list.id}
                  className="flex-1"
                >
                  {duplicatingId === list.id ? "Duplicating..." : "Duplicate"}
                </Button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="panel p-8 text-center">
            <p className="font-display text-2xl font-black">
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
            className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line py-7 text-sm font-bold text-ink-soft transition-all hover:bg-mist-deep"
          >
            + Create a new Givy
          </Link>
        )}
      </div>
    </div>
  );
}
