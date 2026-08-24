"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { useGivy } from "@/lib/givy-context";
import { paypalMeUrl, FIELD_LIMITS, safeSupportUrl } from "@/lib/security";
import type { Occasion } from "@/lib/types";
import { OCCASION_EMOJI, OCCASION_LABELS } from "@/lib/types";

export default function CreatePage() {
  const { createList } = useGivy();
  const router = useRouter();
  const defaultDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 21);
    return d.toISOString().slice(0, 10);
  }, []);

  const [title, setTitle] = useState("");
  const [occasion, setOccasion] = useState<Occasion>("birthday");
  const [eventDate, setEventDate] = useState(defaultDate);
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [enableSupport, setEnableSupport] = useState(false);
  const [supportUrl, setSupportUrl] = useState("");
  const [supportLabel, setSupportLabel] = useState("Support with PayPal");
  const [withDemo, setWithDemo] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      let tipUrl: string | undefined;
      if (enableSupport && supportUrl.trim()) {
        tipUrl =
          safeSupportUrl(supportUrl) ??
          paypalMeUrl(supportUrl) ??
          undefined;
        if (!tipUrl) {
          toast.error(
            "Use a valid https PayPal.me, PayPal, Ko-fi, or Buy Me a Coffee link.",
          );
          setBusy(false);
          return;
        }
      }
      const list = await createList({
        title: title.trim() || "Untitled Givy",
        occasion,
        description: description.trim() || undefined,
        eventDate,
        recipientAddress: address.trim() || undefined,
        supportUrl: tipUrl,
        supportLabel:
          tipUrl ? supportLabel.trim() || "Support with PayPal" : undefined,
        withDemoItems: withDemo,
      });
      if (!list) {
        toast.error("Could not create list. Sign in and try again.");
        return;
      }
      toast.success("List created");
      router.push(`/app/${list.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create list");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl animate-rise lg:max-w-2xl">
      <h1 className="font-display text-3xl tracking-tight text-ink sm:text-4xl lg:text-5xl">
        New Givy
      </h1>
      <p className="mt-2 text-ink-soft lg:text-lg">
        Pick an occasion, set the date, and start collecting ideas.
      </p>

      <form
        onSubmit={onSubmit}
        className="panel mt-6 space-y-4 p-4 sm:p-6 lg:mt-8 lg:space-y-5 lg:p-8"
      >
        <div>
          <Label htmlFor="title">List title</Label>
          <Input
            id="title"
            value={title}
            maxLength={FIELD_LIMITS.listTitle}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Alex's birthday"
            required
          />
        </div>

        <div>
          <Label>Occasion</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {(Object.keys(OCCASION_LABELS) as Occasion[]).map((key) => (
              <Button
                key={key}
                type="button"
                variant="secondary"
                className={`h-auto justify-start rounded-2xl px-3 py-3 text-left text-sm ${
                  occasion === key
                    ? "border-coral bg-coral/10 text-ink"
                    : "bg-white/70 text-ink-soft"
                }`}
                onClick={() => setOccasion(key)}
              >
                <span className="block text-lg">{OCCASION_EMOJI[key]}</span>
                {OCCASION_LABELS[key]}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="date">Event date</Label>
          <Input
            id="date"
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Note for friends (optional)</Label>
          <Textarea
            id="description"
            value={description}
            maxLength={FIELD_LIMITS.description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A few things I'd love. No pressure, just ideas."
          />
        </div>

        <div>
          <Label htmlFor="address">Ship-to-me address (optional)</Label>
          <Input
            id="address"
            value={address}
            maxLength={FIELD_LIMITS.recipientAddress}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Shown when someone ships directly to you"
          />
        </div>

        <div className="rounded-2xl border-2 border-line bg-paper/70 p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-line accent-coral focus-visible:ring-2 focus-visible:ring-coral/40 focus-visible:ring-offset-2"
              checked={enableSupport}
              onChange={(e) => setEnableSupport(e.target.checked)}
            />
            <span>
              <span className="block font-semibold text-ink">
                Support me (for creators)
              </span>
              <span className="block text-sm text-ink-soft">
                PayPal.me or Ko-fi tip link on your public list. Payments stay on
                PayPal — Givy never sees card numbers.
              </span>
            </span>
          </label>
          {enableSupport && (
            <div className="mt-4 space-y-3">
              <Input
                type="url"
                value={supportUrl}
                onChange={(e) => setSupportUrl(e.target.value)}
                placeholder="https://www.paypal.com/paypalme/yourname"
                required={enableSupport}
              />
              <Input
                value={supportLabel}
                onChange={(e) => setSupportLabel(e.target.value)}
                placeholder="Support with PayPal"
              />
            </div>
          )}
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-paper/70 p-3">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-line accent-coral focus-visible:ring-2 focus-visible:ring-coral/40 focus-visible:ring-offset-2"
            checked={withDemo}
            onChange={(e) => setWithDemo(e.target.checked)}
          />
          <span>
            <span className="block font-semibold text-ink">
              Start with sample gift ideas
            </span>
            <span className="block text-sm text-ink-soft">
              Optional. You can edit or remove them anytime.
            </span>
          </span>
        </label>

        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Creating…" : "Create Givy"}
        </Button>
      </form>
    </div>
  );
}
