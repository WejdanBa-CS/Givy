"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { SiteHeader } from "@/components/SiteHeader";
import { useGivy } from "@/lib/givy-context";
import type { AuthProvider } from "@/lib/types";

const providers: {
  id: AuthProvider;
  label: string;
  blurb: string;
  cloudReady: boolean;
}[] = [
  {
    id: "google",
    label: "Continue with Google",
    blurb: "Recommended",
    cloudReady: true,
  },
  {
    id: "apple",
    label: "Continue with Apple",
    blurb: "Private & simple",
    cloudReady: false,
  },
  {
    id: "facebook",
    label: "Continue with Facebook",
    blurb: "Find friends easier later",
    cloudReady: false,
  },
];

function LoginInner() {
  const { user, ready, cloud, signIn } = useGivy();
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") ?? "/app";
  const error = search.get("error");
  const [busy, setBusy] = useState<AuthProvider | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (ready && user) router.replace(next);
  }, [ready, user, router, next]);

  async function onProvider(id: AuthProvider) {
    setBusy(id);
    setMessage(null);
    try {
      if (cloud && id !== "google") {
        setMessage("Apple and Facebook sign-in arrive next. Use Google for now.");
        setBusy(null);
        return;
      }
      await signIn(id, next);
      if (!cloud) router.replace(next);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Sign-in failed");
      setBusy(null);
    }
  }

  return (
    <div className="shell pb-16">
      <SiteHeader />
      <main className="mx-auto mt-10 max-w-md animate-rise">
        <div className="panel p-7 sm:p-8">
          <Logo size="lg" />
          <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight">
            Sign in to Givy
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            {cloud
              ? "Secure OAuth via Google. Create lists, share a link, keep claims anonymous."
              : "Local demo mode: pick a provider to jump in. Connect Supabase for real OAuth."}
          </p>

          {(error || message) && (
            <p className="mt-4 rounded-2xl border border-coral/40 bg-coral/10 p-3 text-sm text-ink">
              {message ?? "Could not finish sign-in. Try again."}
            </p>
          )}

          <div className="mt-7 space-y-3">
            {providers.map((p) => (
              <button
                key={p.id}
                type="button"
                className="btn btn-secondary w-full justify-between rounded-2xl px-4 py-4 text-left"
                disabled={busy !== null}
                onClick={() => void onProvider(p.id)}
              >
                <span>
                  <span className="block font-semibold text-ink">
                    {busy === p.id ? "Signing in…" : p.label}
                  </span>
                  <span className="block text-xs font-medium text-ink-soft">
                    {cloud && !p.cloudReady ? "Coming soon in cloud mode" : p.blurb}
                  </span>
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

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="shell py-20 text-center text-ink-soft">Loading…</div>
      }
    >
      <LoginInner />
    </Suspense>
  );
}
