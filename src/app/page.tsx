"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LogoMark } from "@/components/Logo";
import { useGivy } from "@/lib/givy-context";

const OCCASIONS = [
  { emoji: "🎂", label: "Birthdays" },
  { emoji: "💍", label: "Weddings" },
  { emoji: "🎄", label: "Holidays" },
  { emoji: "🎁", label: "Giveaways" },
  { emoji: "🐣", label: "Baby showers" },
  { emoji: "🎓", label: "Graduations" },
  { emoji: "🏠", label: "Housewarmings" },
  { emoji: "💝", label: "Just because" },
] as const;

function GoogleGlyph() {
  return (
    <span className="grid h-[22px] w-[22px] place-items-center rounded-full bg-white text-[11px] font-extrabold leading-none text-[#4285F4]">
      G
    </span>
  );
}

export default function HomePage() {
  const { user, ready } = useGivy();
  const router = useRouter();

  useEffect(() => {
    if (ready && user) router.replace("/app");
  }, [ready, user, router]);

  return (
    <div className="min-h-screen bg-mist text-ink">
      <header className="shell flex items-center justify-between py-6">
        <Link href="/" className="group flex items-center gap-2.5" aria-label="givy home">
          <span className="logo-mark">
            <LogoMark size={34} />
          </span>
          <span className="font-display text-[1.65rem] font-semibold tracking-tight lowercase">
            givy
          </span>
        </Link>
        <Link href="/login" className="btn btn-primary !rounded-full !px-5 !py-2.5 text-sm">
          Sign in
        </Link>
      </header>

      <section className="shell grid items-center gap-12 pb-16 pt-4 lg:grid-cols-2 lg:gap-12 lg:pb-24 lg:pt-8">
        <div className="animate-rise max-w-xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--gold)] px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.08em] text-ink">
            ✨ New way to wishlist
          </span>

          <h1 className="mt-6 font-display text-[3.1rem] leading-[1.02] tracking-[-0.03em] text-ink sm:text-[4.25rem]">
            Gifts they&apos;ll actually{" "}
            <em className="text-coral" style={{ fontStyle: "italic" }}>
              love.
            </em>
          </h1>

          <p className="mt-5 max-w-[36ch] text-[1.05rem] leading-relaxed text-ink-soft">
            Create a wishlist for any occasion. Share it. Friends claim gifts privately — no
            duplicates, no guesswork, no awkward moments.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="btn btn-primary !rounded-full !px-6 inline-flex items-center gap-2.5"
            >
              <GoogleGlyph />
              Get started free →
            </Link>
            <a href="#how" className="btn btn-secondary !rounded-full !px-6">
              See how it works
            </a>
          </div>

          <div className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t-2 border-line pt-6">
            {[
              { n: "10k+", l: "wishlists created" },
              { n: "98%", l: "claim rate" },
              { n: "Free", l: "forever" },
            ].map((s) => (
              <div key={s.l}>
                <div className="font-display text-2xl font-semibold text-ink">{s.n}</div>
                <div className="mt-0.5 text-xs font-medium text-ink-soft">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative mx-auto h-[440px] w-full max-w-[460px] lg:mx-0 lg:h-[500px]">
          <div className="absolute right-2 top-0 z-20 w-[176px] rotate-3 rounded-2xl border-2 border-line bg-[var(--gold)] p-4 shadow-[0_12px_30px_rgba(26,18,14,0.08)] sm:right-8">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-ink">
              Jordan&apos;s birthday
            </p>
            <p className="mt-1 font-display text-4xl font-semibold leading-none text-ink">
              34 days
            </p>
            <p className="mt-2 text-xs font-semibold text-ink-soft">Sept 15, 2026</p>
          </div>

          <div className="absolute bottom-6 left-0 z-30 w-[214px] -rotate-2 rounded-2xl border-2 border-line bg-paper p-3 shadow-[0_16px_40px_rgba(26,18,14,0.1)] sm:w-[236px]">
            <div className="overflow-hidden rounded-xl bg-[#ece7e2]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80"
                alt="Galaxy Watch 7"
                className="h-28 w-full object-cover"
              />
            </div>
            <div className="mt-3">
              <p className="text-sm font-bold text-ink">Galaxy Watch 7</p>
              <p className="text-xs font-semibold text-ink-soft">$199</p>
            </div>
            <button
              type="button"
              className="mt-3 w-full rounded-full border-2 border-coral bg-paper py-2 text-center text-sm font-bold text-coral"
            >
              Claim this gift 🎁
            </button>
          </div>

          <div className="absolute right-0 top-28 z-10 w-[200px] rotate-2 rounded-2xl border-2 border-line bg-paper p-3 shadow-[0_16px_40px_rgba(26,18,14,0.1)] sm:right-2 sm:w-[220px]">
            <div className="overflow-hidden rounded-xl bg-coral">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80"
                alt="Air Max Sneakers"
                className="h-32 w-full object-cover mix-blend-multiply"
              />
            </div>
            <div className="mt-3">
              <p className="text-sm font-bold text-ink">Air Max Sneakers</p>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs font-semibold text-ink-soft">$150</span>
                <span className="text-xs font-bold text-leaf">● Available</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="border-t-2 border-line bg-paper py-16">
        <div className="shell">
          <p className="text-center text-[11px] font-extrabold uppercase tracking-[0.22em] text-ink-soft">
            How it works
          </p>
          <div className="mt-10 grid gap-10 md:grid-cols-3">
            {[
              {
                icon: "✏️",
                n: "01",
                title: "Build your list",
                body: "Add any gift idea — link a product, set a price, add details.",
              },
              {
                icon: "🔗",
                n: "02",
                title: "Share the link",
                body: "One link to share with family and friends via any channel.",
              },
              {
                icon: "🤫",
                n: "03",
                title: "They claim secretly",
                body: "Friends pick gifts anonymously. No one duplicates, no one spills.",
              },
            ].map((s) => (
              <article key={s.n} className="text-center">
                <div className="text-3xl">{s.icon}</div>
                <p className="mt-4 text-xs font-bold text-ink-soft/70">{s.n}</p>
                <h3 className="mt-1 font-display text-2xl text-ink">{s.title}</h3>
                <p className="mx-auto mt-2 max-w-[28ch] text-sm leading-relaxed text-ink-soft">
                  {s.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="shell border-t-2 border-line py-16">
        <p className="text-center text-[11px] font-extrabold uppercase tracking-[0.22em] text-ink-soft">
          Works for any occasion
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
          {OCCASIONS.map((o) => (
            <span
              key={o.label}
              className="inline-flex items-center gap-2 rounded-full border-2 border-line bg-paper px-4 py-2.5 text-sm font-bold text-ink"
            >
              <span aria-hidden>{o.emoji}</span>
              {o.label}
            </span>
          ))}
        </div>
      </section>

      <section className="bg-coral px-6 py-16 text-center text-white">
        <h2 className="font-display text-3xl tracking-tight sm:text-4xl" style={{ fontStyle: "italic" }}>
          Ready to make gift-giving easy?
        </h2>
        <p className="mx-auto mt-3 max-w-md text-white/90">
          Free for personal wishlists. Always.
        </p>
        <Link
          href="/login"
          className="btn mt-7 !rounded-full !bg-[var(--gold)] !px-7 !text-ink hover:!bg-[var(--gold)]"
        >
          Create your first Givy →
        </Link>
      </section>
    </div>
  );
}
