"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { MotionList, MotionListItem } from "@/components/motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CollapsiblePanel } from "@/components/ui/collapsible";
import { Input, Label, Textarea } from "@/components/ui/input";
import type { GiftSuggestion } from "@/lib/gift-suggest";
import type { Occasion } from "@/lib/types";
import { OCCASION_LABELS } from "@/lib/types";

type Props = {
  occasion: Occasion;
  onUse: (suggestion: GiftSuggestion) => void;
};

export function SuggestGiftsPanel({ occasion, onUse }: Props) {
  const [interests, setInterests] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<GiftSuggestion[]>([]);
  const [source, setSource] = useState<"ai" | "fallback" | null>(null);

  async function onSuggest(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/gift-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          occasion,
          interests: interests.trim(),
          budgetMax: budgetMax ? Number(budgetMax) : undefined,
          count: 5,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        suggestions?: GiftSuggestion[];
        source?: "ai" | "fallback";
      };
      if (!res.ok) {
        toast.error(data.error || "Could not suggest gifts");
        return;
      }
      const list = Array.isArray(data.suggestions) ? data.suggestions : [];
      setSuggestions(list);
      setSource(data.source ?? "fallback");
      if (list.length === 0) {
        toast.message("No ideas this round — try different interests.");
      } else if (data.source === "fallback") {
        toast.message("Curated ideas (AI offline or unavailable)");
      } else {
        toast.success("Gift ideas ready");
      }
    } catch {
      toast.error("Could not reach suggestion service");
    } finally {
      setLoading(false);
    }
  }

  return (
    <CollapsiblePanel
      title="Suggest gifts"
      description={`Ideas for a ${OCCASION_LABELS[occasion].toLowerCase()} — pick one to fill the form below.`}
    >
      <form onSubmit={onSuggest} className="space-y-3">
        <div>
          <Label htmlFor="suggest-interests">Interests or vibe</Label>
          <Textarea
            id="suggest-interests"
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            maxLength={280}
            placeholder="Hiking, indie games, baking sourdough…"
          />
        </div>
        <div>
          <Label htmlFor="suggest-budget">Max budget (optional)</Label>
          <Input
            id="suggest-budget"
            type="number"
            min={0}
            inputMode="numeric"
            value={budgetMax}
            onChange={(e) => setBudgetMax(e.target.value)}
            placeholder="e.g. 50"
          />
        </div>
        <Button type="submit" variant="secondary" disabled={loading}>
          {loading ? "Thinking…" : "Get ideas"}
        </Button>
      </form>

      {suggestions.length > 0 && (
        <MotionList className="mt-4 space-y-2">
          {suggestions.map((s) => (
            <MotionListItem key={s.title}>
              <div className="rounded-2xl border border-line bg-white/70 px-3 py-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink">{s.title}</p>
                    {s.notes && (
                      <p className="mt-0.5 text-sm text-ink-soft">{s.notes}</p>
                    )}
                    {s.why && (
                      <p className="mt-1 text-xs text-ink-soft">{s.why}</p>
                    )}
                    {s.priceHint != null && (
                      <Badge variant="outline" className="mt-2">
                        ~${s.priceHint}
                      </Badge>
                    )}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      onUse(s);
                      toast.success("Filled add-gift form");
                    }}
                  >
                    Use
                  </Button>
                </div>
              </div>
            </MotionListItem>
          ))}
        </MotionList>
      )}

      {source === "fallback" && suggestions.length > 0 && (
        <p className="mt-3 text-xs text-ink-soft">
          Showing curated ideas. Add OPENAI_API_KEY for AI suggestions.
        </p>
      )}
    </CollapsiblePanel>
  );
}
