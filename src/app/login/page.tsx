"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Logo } from "@/components/Logo";
import { SiteHeader } from "@/components/SiteHeader";
import { useGivy } from "@/lib/givy-context";
import type { AuthProvider } from "@/lib/types";

const providers: {
  id: AuthProvider;
  label: string;
  blurb: string;
}[] = [
  { id: "google", label: "Continue with Google", blurb: "Fastest for most people" },
  { id: "apple", label: "Continue with Apple", blurb: "Private & simple" },
  { id: "facebook", label: "Continue with Facebook", blurb: "Find friends easier later" },
];

export default function LoginPage() {
  const { user, ready, signIn } = useGivy();
  const router = useRouter();

  useEffect(() => {
    if (ready && user) router.replace("/app");
  }, [ready, user, router]);

  return (
    <div className="shell pb-16">
      <SiteHeader />
      <main className="mx-auto mt-10 max-w-md animate-rise">
        <div className="panel p-7 sm:p-8">
          <Logo size="lg" />
          <h1 className="mt-4 text-xl font-semibold tracking-tight">
            Link an account to start your list
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Demo sign-in for the MVP — no real OAuth yet. Pick a provider and you&apos;re in.
          </p>

          <div className="mt-7 space-y-3">
            {providers.map((p) => (
              <button
                key={p.id}
                type="button"
                className="btn btn-secondary w-full justify-between rounded-2xl px-4 py-4 text-left"
                onClick={() => {
                  signIn(p.id);
                  router.replace("/app");
                }}
              >
                <span>
                  <span className="block font-semibold text-ink">{p.label}</span>
                  <span className="block text-xs font-medium text-ink-soft">{p.blurb}</span>
                </span>
                <span aria-hidden className="text-ink-soft">
                  →
                </span>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
