"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useGivy } from "@/lib/givy-context";

export default function ResetPasswordPage() {
  const { ready, user, updatePassword } = useGivy();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (ready && !user) router.replace("/login?error=auth");
  }, [ready, router, user]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      await updatePassword(password);
      router.replace("/app/profile?password=updated");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update password.");
    } finally {
      setBusy(false);
    }
  }

  if (!ready || !user) {
    return <div className="shell py-20 text-center text-ink-soft">Verifying password reset…</div>;
  }

  return (
    <div className="shell pb-16 lg:pb-24">
      <main className="mx-auto mt-16 max-w-md">
        <section className="panel p-6 sm:p-8">
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-leaf">Password recovery</p>
          <h1 className="mt-2 font-display text-3xl tracking-tight text-ink">Choose a new password</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">Use at least eight characters. After saving, you will return to your Givy profile.</p>
          {message && <p className="mt-4 rounded-2xl border border-coral/40 bg-coral/10 p-3 text-sm text-ink">{message}</p>}
          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <div className="relative">
              <label className="label" htmlFor="new-password">New password</label>
              <input id="new-password" type={showPassword ? "text" : "password"} className="field pr-20" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} autoComplete="new-password" required disabled={busy} />
              <button type="button" className="absolute bottom-2 right-2 rounded-lg px-2 py-1 text-xs font-bold text-ink-soft hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/40" onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? "Hide" : "Show"}</button>
            </div>
            <div>
              <label className="label" htmlFor="confirm-password">Confirm password</label>
              <input id="confirm-password" type={showPassword ? "text" : "password"} className="field" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={8} autoComplete="new-password" required disabled={busy} />
            </div>
            <button type="submit" className="btn btn-primary w-full" disabled={busy}>{busy ? "Saving…" : "Save new password"}</button>
          </form>
          <Link href="/login" className="mt-5 inline-flex text-sm font-semibold text-ink-soft underline-offset-2 hover:underline">Back to sign in</Link>
        </section>
      </main>
    </div>
  );
}
