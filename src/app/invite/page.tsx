"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { SiteHeader } from "@/components/SiteHeader";
import { redeemInvite } from "@/lib/api";
import { useGivy } from "@/lib/givy-context";

export default function InvitePage() {
  const { user, ready, refresh, signOut } = useGivy();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace("/login?next=/invite");
    else if (user.betaUnlocked) router.replace("/app");
  }, [ready, user, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await redeemInvite(code);
      await refresh();
      router.replace("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invite failed");
      setBusy(false);
    }
  }

  if (!ready || !user || user.betaUnlocked) {
    return <div className="shell py-20 text-center text-ink-soft">Loading…</div>;
  }

  return (
    <div className="shell pb-16">
      <SiteHeader />
      <main className="mx-auto mt-10 max-w-md animate-rise">
        <div className="panel p-7 sm:p-8">
          <Logo size="lg" />
          <h1 className="mt-4 text-xl font-semibold tracking-tight">
            Enter your invite code
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Closed beta is invite-only. Use the code from your tester email.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="label" htmlFor="invite">
                Invite code
              </label>
              <input
                id="invite"
                className="field"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="GIVY-BETA-…"
                required
                autoComplete="off"
              />
            </div>
            {error && (
              <p className="rounded-2xl border border-coral/40 bg-coral/10 p-3 text-sm">
                {error}
              </p>
            )}
            <button type="submit" className="btn btn-primary w-full" disabled={busy}>
              {busy ? "Checking…" : "Unlock beta"}
            </button>
          </form>

          <button
            type="button"
            className="mt-4 text-sm font-semibold text-ink-soft underline-offset-2 hover:underline"
            onClick={() => void signOut().then(() => router.replace("/login"))}
          >
            Sign out
          </button>
        </div>
      </main>
    </div>
  );
}
