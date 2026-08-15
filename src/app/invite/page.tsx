"use client";

import { FormEvent, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/Logo";
import { SiteHeader } from "@/components/SiteHeader";
import { redeemInvite } from "@/lib/api";
import { useGivy } from "@/lib/givy-context";
import { normalizeInviteCode } from "@/lib/security";

function inviteNextPath(code: string | null): string {
  return code ? `/invite?code=${encodeURIComponent(code)}` : "/invite";
}

function goToApp() {
  // Full navigation so middleware re-reads beta_unlocked from the DB.
  window.location.assign("/app");
}

function InviteInner() {
  const { user, ready, signOut } = useGivy();
  const router = useRouter();
  const search = useSearchParams();
  const inviteCode = normalizeInviteCode(search.get("code"));

  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoRedeemStarted = useRef(false);

  useEffect(() => {
    if (inviteCode) setCode(inviteCode);
  }, [inviteCode]);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace(
        `/login?next=${encodeURIComponent(inviteNextPath(inviteCode))}`,
      );
      return;
    }
    if (user.betaUnlocked) goToApp();
  }, [ready, user, router, inviteCode]);

  async function redeem(targetCode: string) {
    const normalized = normalizeInviteCode(targetCode);
    if (!normalized) {
      setError("That invite code looks invalid. Check for typos and try again.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await redeemInvite(normalized);
      goToApp();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invite failed");
      setBusy(false);
    }
  }

  const autoRedeem = useCallback(async (targetCode: string) => {
    if (autoRedeemStarted.current) return;
    autoRedeemStarted.current = true;
    setBusy(true);
    setError(null);
    try {
      await redeemInvite(targetCode);
      goToApp();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invite failed");
      setBusy(false);
      autoRedeemStarted.current = false;
    }
  }, []);

  useEffect(() => {
    if (!ready || !user || user.betaUnlocked || !inviteCode) return;
    void autoRedeem(inviteCode);
  }, [ready, user, inviteCode, autoRedeem]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await redeem(code);
  }

  if (!ready || !user) {
    return <div className="shell py-20 text-center text-ink-soft">Loading…</div>;
  }

  if (user.betaUnlocked || busy) {
    return (
      <div className="shell py-20 text-center text-ink-soft">
        {user.betaUnlocked ? "Opening Givy…" : "Checking invite…"}
      </div>
    );
  }

  return (
    <div className="shell pb-16">
      <SiteHeader />
      <main className="mx-auto mt-10 max-w-md animate-rise">
        <div className="panel p-7 sm:p-8">
          <Logo size="lg" />
          <h1 className="mt-4 text-xl font-semibold tracking-tight">
            {inviteCode ? "Redeem your invite" : "Enter your invite code"}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            {inviteCode
              ? "This link includes your beta invite. We’ll unlock Givy as soon as the code checks out."
              : "Closed beta is invite-only. Use the code or link from your tester email."}
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
                placeholder="your-invite-code"
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

export default function InvitePage() {
  return (
    <Suspense
      fallback={
        <div className="shell py-20 text-center text-ink-soft">Loading…</div>
      }
    >
      <InviteInner />
    </Suspense>
  );
}
