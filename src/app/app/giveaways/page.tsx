"use client";

import Link from "next/link";

/** Giveaways are paused until the cloud API ships. Keep route for old links. */
export default function GiveawaysPage() {
  return (
    <div className="panel mx-auto max-w-lg animate-rise p-8 text-center">
      <h1 className="font-display text-3xl text-ink">Giveaways</h1>
      <p className="mt-3 text-ink-soft">
        Local giveaways are coming soon. For now, create a gift list and share the link.
      </p>
      <Link href="/app/create" className="btn btn-primary mt-6">
        Create a list
      </Link>
    </div>
  );
}
