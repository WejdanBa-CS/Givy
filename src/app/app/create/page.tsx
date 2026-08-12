"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
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

  const [title, setTitle] = useState("My birthday wishlist");
  const [occasion, setOccasion] = useState<Occasion>("birthday");
  const [eventDate, setEventDate] = useState(defaultDate);
  const [description, setDescription] = useState(
    "A few things I'd love — no pressure, just ideas.",
  );
  const [address, setAddress] = useState("");
  const [withDemo, setWithDemo] = useState(true);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const list = await createList({
      title: title.trim() || "Untitled Givy",
      occasion,
      description: description.trim() || undefined,
      eventDate,
      recipientAddress: address.trim() || undefined,
      withDemoItems: withDemo,
    });
    if (list) router.push(`/app/${list.id}`);
  }

  return (
    <div className="mx-auto max-w-xl animate-rise">
      <h1 className="font-display text-4xl tracking-tight text-ink">New Givy</h1>
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
            Note for friends
          </label>
          <textarea
            id="description"
            className="field min-h-24 resize-y"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
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

        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-paper/70 p-3">
          <input
            type="checkbox"
            className="mt-1"
            checked={withDemo}
            onChange={(e) => setWithDemo(e.target.checked)}
          />
          <span>
            <span className="block font-semibold text-ink">
              Start with sample birthday ideas
            </span>
            <span className="block text-sm text-ink-soft">
              Hat, socks, snacks, watch, gift card — edit anytime.
            </span>
          </span>
        </label>

        <button type="submit" className="btn btn-primary w-full">
          Create Givy
        </button>
      </form>
    </div>
  );
}
