import Link from "next/link";
import { LandingAccountLink, LandingCta } from "@/components/LandingActions";
import { LogoMark } from "@/components/Logo";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";
import { Button } from "@/components/ui/button";
import {
  Baby,
  Cake,
  Check,
  EyeOff,
  Gem,
  Gift,
  GraduationCap,
  Heart,
  House,
  Link2,
  PenLine,
  Snowflake,
} from "lucide-react";

const occasions = [
  { Icon: Cake, label: "Birthdays" },
  { Icon: Gem, label: "Weddings" },
  { Icon: Snowflake, label: "Holidays" },
  { Icon: Gift, label: "Giveaways" },
  { Icon: Baby, label: "Baby showers" },
  { Icon: GraduationCap, label: "Graduations" },
  { Icon: House, label: "Housewarmings" },
  { Icon: Heart, label: "Just because" },
];

const promises = ["Free for personal lists", "Claims stay private", "Works with any shop"];

const steps = [
  {
    n: "01",
    Icon: PenLine,
    title: "Build your list",
    body: "Add any gift idea — link a product, set a price, add details.",
  },
  {
    n: "02",
    Icon: Link2,
    title: "Share the link",
    body: "One link to share with family and friends via any channel.",
  },
  {
    n: "03",
    Icon: EyeOff,
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
              <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-soft">
                <span className="h-px w-8 bg-coral" aria-hidden />
                Wishlists for every occasion
              </p>
            </FadeIn>
            <FadeIn delay={0.08}>
              <h1
                id="landing-headline"
                className="mt-6 font-display text-[clamp(2.6rem,7vw,4.5rem)] font-semibold leading-[1.05] tracking-tight text-ink"
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
              <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-2.5">
                {promises.map((p) => (
                  <li key={p} className="flex items-center gap-2 text-sm text-ink-soft">
                    <Check aria-hidden size={15} strokeWidth={2} className="text-leaf" />
                    {p}
                  </li>
                ))}
              </ul>
            </FadeIn>
          </div>

          <FadeIn delay={0.18} className="relative hidden min-h-[22rem] lg:block">
            <div className="absolute right-6 top-2 w-48 rotate-3 rounded-3xl border border-line/80 bg-paper p-4 shadow-[var(--shadow-raised)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=200&fit=crop&auto=format"
                alt=""
                className="mb-3 h-28 w-full rounded-xl bg-mist-deep object-cover"
              />
              <p className="font-display text-xs font-semibold text-ink">Air Max Sneakers</p>
              <p className="text-xs text-ink-soft">$150</p>
              <div className="mt-2.5 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-leaf-soft" />
                <span className="text-xs font-semibold text-leaf">Available</span>
              </div>
            </div>
            <div className="absolute left-2 top-20 w-44 -rotate-2 rounded-3xl border border-line/80 bg-paper p-4 shadow-[var(--shadow-raised)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=200&fit=crop&auto=format"
                alt=""
                className="mb-3 h-24 w-full rounded-xl bg-mist-deep object-cover"
              />
              <p className="font-display text-xs font-semibold text-ink">Galaxy Watch 7</p>
              <p className="text-xs text-ink-soft">$199</p>
              <div className="mt-2.5 rounded-xl bg-[var(--secondary)] py-1.5 text-center">
                <span className="text-xs font-semibold text-coral">Claim this gift</span>
              </div>
            </div>
            <div className="absolute bottom-2 right-0 w-44 rotate-1 rounded-3xl border border-line/80 bg-amber p-4 shadow-[var(--shadow-raised)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink">
                Jordan&apos;s Birthday
              </p>
              <p className="font-display text-2xl font-semibold text-ink">
                34<span className="text-base"> days</span>
              </p>
              <p className="mt-1 text-xs text-ink/60">Sept 15, 2026</p>
            </div>
          </FadeIn>
        </section>

        <section id="how" className="border-y border-line bg-paper py-14">
          <div className="shell">
            <p className="mb-8 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-soft">
              How it works
            </p>
            <Stagger className="grid gap-6 sm:grid-cols-3" delay={0.06}>
              {steps.map((s) => (
                <StaggerItem key={s.n} className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full border border-line bg-mist text-coral">
                      <s.Icon aria-hidden size={18} strokeWidth={1.75} />
                    </span>
                    <span className="font-display text-sm font-semibold tabular-nums text-ink-soft/70">
                      {s.n}
                    </span>
                  </div>
                  <h2 className="font-display text-lg font-semibold text-ink">{s.title}</h2>
                  <p className="text-sm leading-relaxed text-ink-soft">{s.body}</p>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>

        <section className="shell py-14" aria-labelledby="occasions-heading">
          <p
            id="occasions-heading"
            className="mb-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-soft"
          >
            Works for any occasion
          </p>
          <div className="flex flex-wrap gap-3">
            {occasions.map((o) => (
              <div
                key={o.label}
                className="flex h-10 items-center gap-2 rounded-full border border-line/80 bg-paper px-4 text-sm font-medium text-ink shadow-[0_1px_2px_rgba(28,17,8,.04)]"
              >
                <o.Icon aria-hidden size={15} strokeWidth={1.75} className="text-ink-soft" />
                {o.label}
              </div>
            ))}
          </div>
        </section>

        <section className="bg-coral py-16 text-center">
          <div className="shell">
            <h2 className="font-display text-3xl font-semibold italic text-white sm:text-4xl">
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

      <footer className="shell grid gap-1.5 border-t border-line py-7 pb-8 text-center text-sm text-ink-soft">
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
