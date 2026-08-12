"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { SiteHeader } from "@/components/SiteHeader";
import { useGivy } from "@/lib/givy-context";

function LoginInner() {
  const { user, ready, configured, signIn } = useGivy();
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") ?? "/app";
  const error = search.get("error");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (ready && user?.betaUnlocked) router.replace(next);
    else if (ready && user && !user.betaUnlocked) router.replace("/invite");
  }, [ready, user, router, next]);

  async function onGoogle() {
    setBusy(true);
    setMessage(null);
    try {
      await signIn("google", next);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Sign-in failed");
      setBusy(false);
    }
  }

  return (
    <div className="shell pb-16">
      <SiteHeader />
      <main className="mx-auto mt-10 max-w-md animate-rise">
        <div className="panel p-7 sm:p-8">
          <Logo size="lg" />
          <h1 className="mt-4 text-xl font-semibold tracking-tight">
            Sign in for closed beta
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Google only for now. After sign-in you&apos;ll enter an invite code.
          </p>

          {!configured && (
            <p className="mt-4 rounded-2xl border border-coral/40 bg-coral/10 p-3 text-sm text-ink">
              Supabase env vars are missing. Add{" "}
              <code className="text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
              <code className="text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to{" "}
              <code className="text-xs">.env.local</code> (see BETA.md).
            </p>
          )}

          {(error || message) && (
            <p className="mt-4 rounded-2xl border border-coral/40 bg-coral/10 p-3 text-sm text-ink">
              {message ?? "Could not finish Google sign-in. Try again."}
            </p>
          )}

          <div className="mt-7 space-y-3">
            <button
              type="button"
              className="btn btn-primary w-full justify-between rounded-2xl px-4 py-4 text-left"
              disabled={!configured || busy}
              onClick={() => void onGoogle()}
            >
              <span>
                <span className="block font-semibold text-white">
                  {busy ? "Redirecting…" : "Continue with Google"}
                </span>
                <span className="block text-xs font-medium text-white/80">
                  Closed beta auth
                </span>
              </span>
              <span aria-hidden>→</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="shell py-20 text-center text-ink-soft">Loading…</div>}>
      <LoginInner />
    </Suspense>
  );
}
