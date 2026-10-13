import Link from "next/link";
import { LandingAccountLink, LandingCta } from "@/components/LandingActions";
import { LogoMark } from "@/components/Logo";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";
import { Button } from "@/components/ui/button";

const occasions = [
  { emoji: "🎂", label: "Birthdays" },
  { emoji: "💍", label: "Weddings" },
  { emoji: "🎄", label: "Holidays" },
  { emoji: "🎁", label: "Giveaways" },
  { emoji: "👶", label: "Baby showers" },
  { emoji: "🎓", label: "Graduations" },
  { emoji: "🏠", label: "Housewarmings" },
  { emoji: "💝", label: "Just because" },
];

const steps = [
  {
    n: "01",
    emoji: "✏️",
    title: "Build your list",
    body: "Add any gift idea — link a product, set a price, add details.",
  },
  {
    n: "02",
    emoji: "🔗",
    title: "Share the link",
    body: "One link to share with family and friends via any channel.",
  },
  {
    n: "03",
    emoji: "🤫",
    title: "They claim secretly",
    body: "Friends pick gifts anonymously. No one duplicates, no one spills.",
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-mist text-ink">
      <a className="skip-link" href="#how">Skip to how it works</a>

      <header className="sticky top-0 z-20 border-b border-line bg-mist/90 backdrop-blur-md">
        <div className="shell flex items-center justify-between py-4 pt-[max(1rem,calc(env(safe-area-inset-top,0px)+0.75rem))]">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-coral"
            aria-label="Givy home"
          >
            <LogoMark size={36} />
            <span className="font-display text-xl font-black tracking-tight text-ink">Givy</span>
          </Link>
          <LandingAccountLink />
        </div>
      </header>

      <main id="main">
        <section
          className="shell grid items-center gap-10 py-12 lg:grid-cols-2 lg:gap-12 lg:py-16"
          aria-labelledby="landing-headline"
        >
          <div>
            <FadeIn>
              <span className="inline-flex items-center gap-2 rounded-full bg-amber px-3 py-1.5 text-xs font-black uppercase tracking-widest text-ink">
                ✦ New way to wishlist
              </span>
            </FadeIn>
            <FadeIn delay={0.08}>
              <h1
                id="landing-headline"
                className="mt-6 font-display text-[clamp(2.6rem,7vw,4.5rem)] font-black leading-[1.05] tracking-tight text-ink"
              >
                Gifts they&apos;ll actually{" "}
                <em className="italic text-coral">love.</em>
              </h1>
            </FadeIn>
            <FadeIn delay={0.14}>
              <p className="mt-5 max-w-md text-lg leading-relaxed text-ink-soft">
                Create a wishlist for any occasion. Share it. Friends claim gifts privately —
                no duplicates, no guesswork, no awkward moments.
              </p>
            </FadeIn>
            <FadeIn delay={0.2} className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <LandingCta className="min-h-12 w-full sm:w-auto" />
              <Button asChild size="lg" variant="secondary" className="min-h-12 w-full sm:w-auto">
                <a href="#how">See how it works</a>
              </Button>
            </FadeIn>
            <FadeIn delay={0.26}>
              <div className="mt-10 flex flex-wrap gap-8">
                {[
                  { n: "10k+", l: "wishlists created" },
                  { n: "98%", l: "claim rate" },
                  { n: "Free", l: "forever" },
                ].map((s) => (
                  <div key={s.l}>
                    <p className="font-display text-lg font-black text-ink">{s.n}</p>
                    <p className="text-xs text-ink-soft">{s.l}</p>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>

          <FadeIn delay={0.18} className="relative hidden min-h-[22rem] lg:block">
            <div className="absolute right-6 top-2 w-48 rotate-3 rounded-3xl border-2 border-line bg-paper p-4 shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=200&fit=crop&auto=format"
                alt=""
                className="mb-3 h-28 w-full rounded-xl bg-mist-deep object-cover"
              />
              <p className="font-display text-xs font-black text-ink">Air Max Sneakers</p>
              <p className="text-xs text-ink-soft">$150</p>
              <div className="mt-2.5 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-leaf-soft" />
                <span className="text-xs font-bold text-leaf">Available</span>
              </div>
            </div>
            <div className="absolute left-2 top-20 w-44 -rotate-2 rounded-3xl border-2 border-line bg-paper p-4 shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=200&fit=crop&auto=format"
                alt=""
                className="mb-3 h-24 w-full rounded-xl bg-mist-deep object-cover"
              />
              <p className="font-display text-xs font-black text-ink">Galaxy Watch 7</p>
              <p className="text-xs text-ink-soft">$199</p>
              <div className="mt-2.5 rounded-xl bg-[var(--secondary)] py-1.5 text-center">
                <span className="text-xs font-black text-coral">Claim this gift</span>
              </div>
            </div>
            <div className="absolute bottom-2 right-0 w-44 rotate-1 rounded-3xl border-2 border-line bg-amber p-4 shadow-lg">
              <p className="text-xs font-black uppercase tracking-widest text-ink">
                Jordan&apos;s Birthday
              </p>
              <p className="font-display text-2xl font-black text-ink">
                34<span className="text-base"> days</span>
              </p>
              <p className="mt-1 text-xs text-ink/60">Sept 15, 2026</p>
            </div>
          </FadeIn>
        </section>

        <section id="how" className="border-y-2 border-line bg-paper py-14">
          <div className="shell">
            <p className="mb-8 text-center text-xs font-black uppercase tracking-widest text-ink-soft">
              How it works
            </p>
            <Stagger className="grid gap-6 sm:grid-cols-3" delay={0.06}>
              {steps.map((s) => (
                <StaggerItem key={s.n} className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-line">{s.n}</span>
                    <span className="text-2xl" aria-hidden>
                      {s.emoji}
                    </span>
                  </div>
                  <h2 className="font-display text-lg font-black text-ink">{s.title}</h2>
                  <p className="text-sm leading-relaxed text-ink-soft">{s.body}</p>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>

        <section className="shell py-14" aria-labelledby="occasions-heading">
          <p
            id="occasions-heading"
            className="mb-6 text-xs font-black uppercase tracking-widest text-ink-soft"
          >
            Works for any occasion
          </p>
          <div className="flex flex-wrap gap-3">
            {occasions.map((o) => (
              <div
                key={o.label}
                className="flex items-center gap-2 rounded-2xl border-2 border-line bg-paper px-4 py-2.5 text-sm font-bold text-ink"
              >
                <span aria-hidden>{o.emoji}</span> {o.label}
              </div>
            ))}
          </div>
        </section>

        <section className="bg-coral py-16 text-center">
          <div className="shell">
            <h2 className="font-display text-3xl font-black italic text-white sm:text-4xl">
              Ready to make gift-giving easy?
            </h2>
            <p className="mt-4 text-lg text-white/80">Free for personal wishlists. Always.</p>
            <LandingCta
              compact
              className="mx-auto mt-8 inline-flex min-h-12 !bg-amber !text-ink hover:!opacity-90"
            />
          </div>
        </section>
      </main>

      <footer className="shell grid gap-1.5 border-t-2 border-line py-7 pb-8 text-center text-sm text-ink-soft">
        <p>© {new Date().getFullYear()} Wejdan Al Amri · Givy · All rights reserved</p>
        <p className="mx-auto max-w-xl text-xs leading-relaxed">
          Some shop links may be affiliate links. We may earn a commission if you buy through them,
          at no extra cost to you. See{" "}
          <Link
            className="underline underline-offset-3 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-coral"
            href="/terms"
          >
            Terms
          </Link>
          .
        </p>
        <nav className="flex flex-wrap justify-center gap-x-1" aria-label="Legal">
          <Link
            className="inline-flex min-h-11 items-center px-3 underline underline-offset-3 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-coral"
            href="/privacy"
          >
            Privacy
          </Link>
          <Link
            className="inline-flex min-h-11 items-center px-3 underline underline-offset-3 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-coral"
            href="/terms"
          >
            Terms
          </Link>
          <Link
            className="inline-flex min-h-11 items-center px-3 underline underline-offset-3 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-coral"
            href="/delete-account"
          >
            Delete account
          </Link>
        </nav>
      </footer>
    </div>
  );
}
