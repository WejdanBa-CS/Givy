"use client";

import { FormEvent, useMemo, useState } from "react";
import { useGivy } from "@/lib/givy-context";
import { formatShortDate } from "@/lib/store";

export default function GiveawaysPage() {
  const { user, giveaways, createGiveaway, joinGiveaway, drawGiveaway } = useGivy();
  const [showForm, setShowForm] = useState(false);
  const defaultEnd = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  }, []);

  const [title, setTitle] = useState("");
  const [itemName, setItemName] = useState("");
  const [description, setDescription] = useState("");
  const [area, setArea] = useState("Within 10 miles");
  const [endsAt, setEndsAt] = useState(defaultEnd);

  function onCreate(e: FormEvent) {
    e.preventDefault();
    createGiveaway({
      title: title.trim() || "Local giveaway",
      itemName: itemName.trim() || "Free item",
      description: description.trim() || "Pickup only.",
      area: area.trim() || "Nearby",
      endsAt,
    });
    setShowForm(false);
    setTitle("");
    setItemName("");
    setDescription("");
  }

  return (
    <div className="animate-rise space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl tracking-tight text-ink">Giveaways</h1>
          <p className="mt-1 max-w-md text-ink-soft">
            Free stuff nearby. Join the pool, and a lucky person gets to pick it up.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "Post a giveaway"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={onCreate} className="panel space-y-3 p-5">
          <input
            className="field"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <input
            className="field"
            placeholder="What's free?"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            required
          />
          <textarea
            className="field min-h-20"
            placeholder="Details for pickup"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className="field"
              placeholder="Area"
              value={area}
              onChange={(e) => setArea(e.target.value)}
            />
            <input
              className="field"
              type="date"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Publish giveaway
          </button>
        </form>
      )}

      <div className="stagger space-y-3">
        {giveaways.map((g) => {
          const isOwner = g.ownerId === user?.id;
          const joined = user ? g.entrantIds.includes(user.id) : false;
          return (
            <article key={g.id} className="panel p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-leaf">
                    {g.status === "open" ? "Open" : g.status === "drawn" ? "Drawn" : "Closed"} ·{" "}
                    {g.area}
                  </p>
                  <h2 className="mt-1 font-display text-2xl text-ink">{g.title}</h2>
                  <p className="mt-1 font-semibold text-ink-soft">{g.itemName}</p>
                  <p className="mt-2 text-sm text-ink-soft">{g.description}</p>
                  <p className="mt-2 text-xs text-ink-soft">
                    By {g.ownerName} · ends {formatShortDate(g.endsAt)} · {g.entrantIds.length}{" "}
                    joined
                    {g.winnerName ? ` · Winner: ${g.winnerName}` : ""}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {!isOwner && g.status === "open" && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={joined}
                    onClick={() => joinGiveaway(g.id)}
                  >
                    {joined ? "You're in" : "Join giveaway"}
                  </button>
                )}
                {isOwner && g.status === "open" && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={g.entrantIds.length === 0}
                    onClick={() => drawGiveaway(g.id)}
                  >
                    Draw a winner
                  </button>
                )}
                {isOwner && <span className="self-center text-sm font-semibold text-leaf">Yours</span>}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
