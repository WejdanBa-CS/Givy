"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);
  return (
    <main className="shell grid min-h-[60vh] place-items-center py-16 text-center">
      <div>
        <h1 className="font-display text-3xl text-ink">Something went wrong</h1>
        <p className="mt-2 text-ink-soft">Please try again.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button type="button" className="btn btn-primary" onClick={reset}>
            Try again
          </button>
          <Link href="/" className="btn btn-secondary">
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
