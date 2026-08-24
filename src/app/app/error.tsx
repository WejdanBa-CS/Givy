"use client";

import Link from "next/link";
import { useEffect } from "react";

type AppErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AppError({ error, reset }: AppErrorProps) {
  useEffect(() => {
    console.error("Givy app route error", error);
  }, [error]);

  return (
    <div className="shell grid min-h-[60vh] place-items-center py-10">
      <section className="panel max-w-lg p-6 text-center sm:p-8">
        <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-leaf">Something went wrong</p>
        <h1 className="mt-2 font-display text-3xl tracking-tight text-ink">Your workspace is still safe.</h1>
        <p className="mt-3 text-ink-soft">We could not load this part of Givy. Try again, or return to your lists and continue from there.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" className="btn btn-primary" onClick={reset}>Try again</button>
          <Link href="/app/lists" className="btn btn-secondary">My lists</Link>
        </div>
      </section>
    </div>
  );
}
