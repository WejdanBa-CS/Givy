"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import {
  GIFT_CATEGORIES,
  GIFT_CATEGORY_LABELS,
  type GiftCategory,
  type RecommendedGift,
} from "@/lib/ai/recommend-gifts";
import type { Occasion } from "@/lib/types";
import { OCCASION_LABELS } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CollapsiblePanel } from "@/components/ui/collapsible";
import { Input, Label } from "@/components/ui/input";
import { cn } from "@/lib/cn";

type Props = {
  occasion: Occasion;
  onUse?: (gift: RecommendedGift) => void;
  className?: string;
};

export function AiGiftRecommend({ occasion, onUse, className }: Props) {
  const [category, setCategory] = useState<GiftCategory>("home");
  const [budgetMin, setBudgetMin] = useState("20");
  const [budgetMax, setBudgetMax] = useState("80");
  const [loading, setLoading] = useState(false);
  const [gifts, setGifts] = useState<RecommendedGift[]>([]);
  const [source, setSource] = useState<"ai" | "catalog" | "fallback" | null>(
    null,
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setGifts([]);
    setSource(null);
    try {
      const res = await fetch("/api/ai/recommend-gifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          budget_min: Number(budgetMin) || 0,
          budget_max: Number(budgetMax) || 0,
          occasion,
          count: 6,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        gifts?: RecommendedGift[];
        source?: "ai" | "catalog" | "fallback";
        catalog_hits?: number;
      };
      if (!res.ok) {
        toast.error(data.error || "Could not recommend gifts");
        return;
      }
      const list = Array.isArray(data.gifts) ? data.gifts : [];
      setGifts(list);
      setSource(data.source ?? "fallback");
      if (list.length === 0) {
        toast.message("No ideas in that budget — try widening the range.");
      } else if (data.source === "ai") {
        toast.success("AI recommendations ready");
      } else {
        toast.message("Catalog picks (AI offline or unavailable)");
      }
    } catch {
      toast.error("Could not reach the recommendation service");
    } finally {
      setLoading(false);
    }
  }

  return (
    <CollapsiblePanel
      title="AI gift engine"
      description={`Category + budget recommendations for a ${OCCASION_LABELS[occasion].toLowerCase()}.`}
      className={className}
    >
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <Label htmlFor="ai-gift-category">Category</Label>
          <select
            id="ai-gift-category"
            className="field mt-1 w-full"
            value={category}
            onChange={(e) => setCategory(e.target.value as GiftCategory)}
          >
            {GIFT_CATEGORIES.map((key) => (
              <option key={key} value={key}>
                {GIFT_CATEGORY_LABELS[key]}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="ai-budget-min">Min budget ($)</Label>
            <Input
              id="ai-budget-min"
              type="number"
              min={0}
              inputMode="numeric"
              value={budgetMin}
              onChange={(e) => setBudgetMin(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="ai-budget-max">Max budget ($)</Label>
            <Input
              id="ai-budget-max"
              type="number"
              min={1}
              inputMode="numeric"
              value={budgetMax}
              onChange={(e) => setBudgetMax(e.target.value)}
              required
            />
          </div>
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? "Finding gifts…" : "Recommend gifts"}
        </Button>
      </form>

      {loading && (
        <div
          className="mt-4 grid gap-3 sm:grid-cols-2"
          aria-busy="true"
          aria-live="polite"
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-36 animate-pulse rounded-2xl border border-line bg-mist/80"
            />
          ))}
        </div>
      )}

      {!loading && gifts.length > 0 && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {gifts.map((gift) => (
            <Card
              key={`${gift.title}-${gift.estimated_price}`}
              variant="inset"
              padding="sm"
              className={cn("flex flex-col")}
            >
              <CardHeader className="!p-0 !pb-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-semibold leading-snug text-ink">
                    {gift.title}
                  </p>
                  <Badge variant="outline">${gift.estimated_price}</Badge>
                </div>
              </CardHeader>
              <CardContent className="!p-0 flex flex-1 flex-col gap-2">
                <p className="text-sm text-ink-soft">{gift.short_description}</p>
                <p className="text-xs text-ink-soft">
                  Search:{" "}
                  <span className="font-medium text-ink">
                    {gift.search_keyword}
                  </span>
                </p>
                {gift.affiliate_ready && (
                  <Badge variant="leaf" className="w-fit text-xs">
                    Catalog match
                  </Badge>
                )}
                {onUse && (
                  <Button
                    type="button"
                    size="sm"
                    className="mt-auto"
                    onClick={() => {
                      onUse(gift);
                      toast.success("Filled add-gift form");
                    }}
                  >
                    Use idea
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {source && source !== "ai" && gifts.length > 0 && (
        <p className="mt-3 text-xs text-ink-soft">
          Showing catalog-backed ideas. Set OPENAI_API_KEY on the server for
          full AI shopping.
        </p>
      )}
    </CollapsiblePanel>
  );
}
