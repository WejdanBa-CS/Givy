"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { useGivy } from "@/lib/givy-context";
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
  const [supportLabel, setSupportLabel] = useState("Support me");
  const [withDemo, setWithDemo] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const list = await createList({
        title: title.trim() || "Untitled Givito",
        occasion,
        description: description.trim() || undefined,
        eventDate,
        recipientAddress: address.trim() || undefined,
        supportUrl:
          enableSupport && supportUrl.trim() ? supportUrl.trim() : undefined,
        supportLabel:
          enableSupport && supportUrl.trim()
            ? supportLabel.trim() || "Support me"
            : undefined,
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
    <div className="mx-auto max-w-xl animate-rise">
      <h1 className="font-display text-4xl tracking-tight text-ink">New Givito</h1>
      <p className="mt-2 text-ink-soft">
        Pick an occasion, set the date, and start collecting ideas.
      </p>

      <form onSubmit={onSubmit} className="panel mt-6 space-y-4 p-6">
        <div>
          <label className="label" htmlFor="title">
            List title
          </label>
          <input
            id="title"
            className="field"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Alex's birthday"
            required
          />
        </div>

        <div>
          <p className="label">Occasion</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {(Object.keys(OCCASION_LABELS) as Occasion[]).map((key) => (
              <button
                key={key}
                type="button"
                className={`rounded-2xl border px-3 py-3 text-left text-sm font-semibold ${
                  occasion === key
                    ? "border-coral bg-coral/10 text-ink"
                    : "border-line bg-white/70 text-ink-soft"
                }`}
                onClick={() => setOccasion(key)}
              >
                <span className="block text-lg">{OCCASION_EMOJI[key]}</span>
                {OCCASION_LABELS[key]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label" htmlFor="date">
            Event date
          </label>
          <input
            id="date"
            type="date"
            className="field"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="label" htmlFor="description">
            Note for friends (optional)
          </label>
          <textarea
            id="description"
            className="field min-h-24 resize-y"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A few things I'd love. No pressure, just ideas."
          />
        </div>

        <div>
          <label className="label" htmlFor="address">
            Ship-to-me address (optional)
          </label>
          <input
            id="address"
            className="field"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Shown when someone ships directly to you"
          />
        </div>

        <div className="rounded-2xl border-2 border-line bg-paper/70 p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-1"
              checked={enableSupport}
              onChange={(e) => setEnableSupport(e.target.checked)}
            />
            <span>
              <span className="block font-semibold text-ink">
                Support me (for creators)
              </span>
              <span className="block text-sm text-ink-soft">
                Add a tip link on your public list.
              </span>
            </span>
          </label>
          {enableSupport && (
            <div className="mt-4 space-y-3">
              <input
                className="field"
                type="url"
                value={supportUrl}
                onChange={(e) => setSupportUrl(e.target.value)}
                placeholder="https://ko-fi.com/yourname"
                required={enableSupport}
              />
              <input
                className="field"
                value={supportLabel}
                onChange={(e) => setSupportLabel(e.target.value)}
                placeholder="Support me"
              />
            </div>
          )}
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-paper/70 p-3">
          <input
            type="checkbox"
            className="mt-1"
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

        <button type="submit" className="btn btn-primary w-full" disabled={busy}>
          {busy ? "Creating…" : "Create Givito"}
        </button>
      </form>
    </div>
  );
}
