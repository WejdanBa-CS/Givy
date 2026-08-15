"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { SiteHeader } from "@/components/SiteHeader";
import { useGivy } from "@/lib/givy-context";
import { safeNextPath } from "@/lib/safe-next";
import type { AuthProvider } from "@/lib/types";

const providers: {
  id: Exclude<AuthProvider, "guest" | "email" | "apple">;
  label: string;
  blurb: string;
}[] = [
  {
    id: "google",
    label: "Continue with Google",
    blurb: "Use your Google account",
  },
  {
    id: "facebook",
    label: "Continue with Facebook",
    blurb: "Use your Facebook account",
  },
];

function ProviderIcon({ id }: { id: "google" | "facebook" }) {
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

  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#1877F2"
        d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953h-1.513c-1.491 0-1.956.928-1.956 1.88v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"
      />
    </svg>
  );
}

function LoginInner() {
  const { user, ready, cloud, signIn, signInWithEmail, signUpWithEmail } =
    useGivy();
  const router = useRouter();
  const search = useSearchParams();
  const next = safeNextPath(search.get("next"), "/app");
  const error = search.get("error");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    if (!ready || !user) return;
    // Don't bounce unlocked users back through the invite screen.
    if (user.betaUnlocked && next.startsWith("/invite")) {
      router.replace("/app");
      return;
    }
    router.replace(next);
  }, [ready, user, router, next]);

  if (!ready || user) {
    return (
      <div className="shell py-20 text-center text-ink-soft">Loading…</div>
    );
  }

  async function onProvider(id: AuthProvider) {
    setBusy(id);
    setMessage(null);
    setInfo(null);
    try {
      await signIn(id, next);
      if (!cloud || id === "guest") router.replace(next);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Sign-in failed");
      setBusy(null);
    }
  }

  async function onEmailSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy("email");
    setMessage(null);
    setInfo(null);
    try {
      if (mode === "signup") {
        const result = await signUpWithEmail(email, password, name);
        if (result.needsEmailConfirm) {
          setInfo(
            "Account created. Check your inbox and spam for a confirmation link, then sign in here.",
          );
          setMode("signin");
          setBusy(null);
          return;
        }
      } else {
        await signInWithEmail(email, password);
      }
      router.replace(next);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Email sign-in failed");
      setBusy(null);
    }
  }

  const errorText =
    message ??
    (error === "auth"
      ? "Sign-in was cancelled or failed. Please try again."
      : error
        ? "Could not finish sign-in. Try again."
        : null);

  return (
    <div className="shell pb-16 lg:pb-24">
      <SiteHeader />
      <main className="mx-auto mt-10 max-w-md animate-rise lg:mt-16">
        <div className="panel p-5 sm:p-7 md:p-8 lg:p-9">
          <Logo size="lg" />
          <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Sign in to Givy
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Create lists, share one link, and keep gift claims private.
          </p>

          {errorText && (
            <p className="mt-4 rounded-2xl border border-coral/40 bg-coral/10 p-3 text-sm text-ink">
              {errorText}
            </p>
          )}
          {info && (
            <p className="mt-4 rounded-2xl border border-leaf/30 bg-leaf/10 p-3 text-sm text-ink">
              {info}
            </p>
          )}

          <form onSubmit={onEmailSubmit} className="mt-7 space-y-3">
            <div className="flex gap-2 rounded-2xl border border-line bg-mist/40 p-1">
              <button
                type="button"
                className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  mode === "signin"
                    ? "bg-paper text-ink shadow-sm"
                    : "text-ink-soft"
                }`}
                disabled={busy !== null}
                onClick={() => setMode("signin")}
              >
                Sign in
              </button>
              <button
                type="button"
                className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  mode === "signup"
                    ? "bg-paper text-ink shadow-sm"
                    : "text-ink-soft"
                }`}
                disabled={busy !== null}
                onClick={() => setMode("signup")}
              >
                Create account
              </button>
            </div>

            {mode === "signup" && (
              <div>
                <label className="label" htmlFor="name">
                  Display name
                </label>
                <input
                  id="name"
                  className="field"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                  disabled={busy !== null}
                />
              </div>
            )}
            <div>
              <label className="label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                required
                autoComplete="email"
                disabled={busy !== null}
              />
            </div>
            <div>
              <label className="label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                minLength={8}
                autoComplete={
                  mode === "signup" ? "new-password" : "current-password"
                }
                disabled={busy !== null}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={busy !== null}
            >
              {busy === "email"
                ? mode === "signup"
                  ? "Creating…"
                  : "Signing in…"
                : mode === "signup"
                  ? "Create account"
                  : "Sign in with email"}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center" aria-hidden>
              <div className="w-full border-t border-line" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-paper px-3 font-medium uppercase tracking-wide text-ink-soft">
                or
              </span>
            </div>
          </div>

          <div className="space-y-3">
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
                    {p.blurb}
                  </span>
                </span>
                <span aria-hidden className="shrink-0 text-ink-soft">
                  →
                </span>
              </button>
            ))}
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center" aria-hidden>
              <div className="w-full border-t border-line" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-paper px-3 font-medium uppercase tracking-wide text-ink-soft">
                or
              </span>
            </div>
          </div>

          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-2xl border-2 border-dashed border-line bg-mist/60 px-4 py-3.5 text-left transition hover:border-coral/40 hover:bg-mist-deep/40 disabled:opacity-60"
            disabled={busy !== null}
            onClick={() => void onProvider("guest")}
          >
            <span
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-line bg-white text-lg"
              aria-hidden
            >
              ✦
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-ink">
                {busy === "guest" ? "Opening…" : "Continue as guest"}
              </span>
              <span className="block text-xs font-medium text-ink-soft">
                No email. Safe for testers — stays in this browser.
              </span>
            </span>
            <span aria-hidden className="shrink-0 text-ink-soft">
              →
            </span>
          </button>

          <p className="mt-6 text-center text-xs text-ink-soft">
            By continuing you agree to our{" "}
            <Link
              href="/terms"
              className="font-semibold underline-offset-2 hover:underline"
            >
              Terms
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="font-semibold underline-offset-2 hover:underline"
            >
              Privacy
            </Link>
            .
          </p>
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
