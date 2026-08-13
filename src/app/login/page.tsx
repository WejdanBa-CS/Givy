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
    id: "facebook",
    label: "Continue with Facebook",
    blurb: "Use your Facebook account",
    cloudReady: true,
  },
  {
    id: "apple",
    label: "Continue with Apple",
    blurb: "Private & simple",
    cloudReady: false,
  },
];

function ProviderIcon({ id }: { id: AuthProvider }) {
  if (id === "google") {
    return (
      <svg width="22" height="22" viewBox="0 0 48 48" aria-hidden>
        <path
          fill="#EA4335"
          d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
        />
        <path
          fill="#4285F4"
          d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
        />
        <path
          fill="#FBBC05"
          d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
        />
        <path
          fill="#34A853"
          d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
        />
      </svg>
    );
  }

  if (id === "facebook") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
        <path
          fill="#1877F2"
          d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953h-1.513c-1.491 0-1.956.928-1.956 1.88v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"
        />
      </svg>
    );
  }

  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#111111"
        d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"
      />
    </svg>
  );
}

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
      if (cloud && id === "apple") {
        setMessage("Apple sign-in comes next. Use Google or Facebook for now.");
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
              ? "Sign in with Google or Facebook. Create lists, share a link, keep claims anonymous."
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
                className="flex w-full items-center gap-3 rounded-2xl border-2 border-line bg-paper px-4 py-3.5 text-left transition hover:bg-mist-deep/40 disabled:opacity-60"
                disabled={busy !== null}
                onClick={() => void onProvider(p.id)}
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-line bg-white">
                  <ProviderIcon id={p.id} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-ink">
                    {busy === p.id ? "Signing in…" : p.label}
                  </span>
                  <span className="block text-xs font-medium text-ink-soft">
                    {cloud && !p.cloudReady
                      ? "Coming soon in cloud mode"
                      : p.blurb}
                  </span>
                </span>
                <span aria-hidden className="shrink-0 text-ink-soft">
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
