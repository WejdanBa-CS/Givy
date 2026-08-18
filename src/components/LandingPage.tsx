"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LandingProductPreview } from "@/components/LandingProductPreview";
import { LogoMark } from "@/components/Logo";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { useGivy } from "@/lib/givy-context";

const occasions = [
  { title: "Birthdays", body: "One link for the whole group." },
  { title: "Weddings", body: "A registry without the double gifts." },
  { title: "Baby showers", body: "Let people claim what you’ll actually use." },
  { title: "Graduations", body: "Share a list instead of a hint." },
  { title: "Holidays", body: "Family shopping without the group-chat chaos." },
  { title: "Group gifts", body: "See what’s taken before anyone spends." },
];

const steps = [
  {
    n: "01",
    title: "Create a list",
    body: "Add ideas with links and prices for birthdays, weddings, and more.",
    icon: (
      <svg viewBox="0 0 32 32" aria-hidden className="landing-step-svg">
        <rect x="6" y="5" width="20" height="22" rx="3.5" fill="none" stroke="currentColor" strokeWidth="1.75" />
        <path d="M11 12h10M11 17h10M11 22h6" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    n: "02",
    title: "Share one link",
    body: "Send it to friends and family. Anyone can open it.",
    icon: (
      <svg viewBox="0 0 32 32" aria-hidden className="landing-step-svg">
        <path
          d="M13.2 18.8a5.2 5.2 0 0 1 0-7.4l3.2-3.2a5.2 5.2 0 1 1 7.4 7.4l-1.6 1.6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
        <path
          d="M18.8 13.2a5.2 5.2 0 0 1 0 7.4l-3.2 3.2a5.2 5.2 0 1 1-7.4-7.4l1.6-1.6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    n: "03",
    title: "They claim in private",
    body: "You see what’s taken. You never see who bought it.",
    icon: (
      <svg viewBox="0 0 32 32" aria-hidden className="landing-step-svg">
        <rect x="8" y="14" width="16" height="12" rx="3" fill="none" stroke="currentColor" strokeWidth="1.75" />
        <path d="M12 14v-2.4a4 4 0 0 1 8 0V14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
    ),
  },
];

export function LandingPage() {
  const router = useRouter();
  const { user, ready } = useGivy();
  const signedIn = ready && user;
  const startHref = signedIn ? "/app" : "/signup";
  const signInHref = signedIn ? "/app" : "/login";

  return (
    <div className="landing min-h-screen bg-mist text-ink">
      <a className="skip-link" href="#preview">
        Skip to product preview
      </a>
      <header className="landing-nav">
        <Link href="/" className="landing-nav-home inline-flex items-center gap-2.5" aria-label="Givy home">
          <LogoMark size={36} />
          <span className="font-display text-xl font-semibold tracking-tight">Givy</span>
        </Link>
        <Button asChild variant="ghost" size="sm" className="landing-nav-cta text-inherit">
          <Link href={signInHref}>
            {signedIn ? "My lists" : "Sign in"}
          </Link>
        </Button>
      </header>

      <main id="main">
      <section className="landing-hero" aria-labelledby="landing-headline">
        <div className="landing-hero-media">
          {/*
            Static AVIF/WebP/JPEG (not /_next/image) for LCP on cold hosts:
            precompressed sources + matching preload in root layout.
          */}
          <picture>
            <source srcSet="/givy-hero.avif" type="image/avif" />
            <source srcSet="/givy-hero.webp" type="image/webp" />
            <img
              src="/givy-hero.jpg"
              alt="A wrapped cream gift tied with a ribbon"
              width={1536}
              height={1024}
              decoding="async"
              fetchPriority="high"
              className="landing-hero-img"
            />
          </picture>
          <div className="landing-hero-veil" />
        </div>

        <div className="landing-hero-copy shell">
          <FadeIn>
            <p className="landing-brand font-display">Givy</p>
          </FadeIn>
          <FadeIn delay={0.12}>
            <h1 id="landing-headline" className="landing-headline">
              One list. Zero awkward duplicates.
            </h1>
          </FadeIn>
          <FadeIn delay={0.22}>
            <p className="landing-lede">
              Create one list, share one link, and let friends claim gifts privately — so nobody buys the same gift twice.
            </p>
          </FadeIn>
          <FadeIn delay={0.32} className="landing-cta">
            <Button size="lg" onClick={() => router.push(startHref)}>
              {signedIn ? "Open my lists" : "Start free"}
            </Button>
            <Button asChild size="lg" variant="secondary" className="landing-cta-secondary">
              <a href="#preview">See a list</a>
            </Button>
          </FadeIn>
        </div>
      </section>

      <section className="landing-trust shell" aria-label="Why Givy">
        {[
          "No duplicate gifts",
          "Private claims",
          "Free to start",
        ].map((item) => (
          <span key={item}>
            <span className="landing-trust-dot" aria-hidden />
            {item}
          </span>
        ))}
      </section>

      <LandingProductPreview />

      <section className="landing-mid-cta">
        <FadeIn className="shell text-center">
          <h2 className="font-display text-3xl tracking-tight sm:text-4xl">
            Make yours in under a minute.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-ink-soft">
            Create a list, share the link, and let people claim in private.
          </p>
          <Button
            size="lg"
            className="mt-8 landing-close-cta"
            onClick={() => router.push(startHref)}
          >
            {signedIn ? "Go to my lists" : "Start free"}
          </Button>
        </FadeIn>
      </section>

      <section id="privacy" className="landing-section shell" aria-labelledby="privacy-heading">
        <FadeIn>
          <p className="landing-kicker">Private by design</p>
          <h2 id="privacy-heading" className="font-display text-3xl tracking-tight sm:text-4xl lg:text-5xl">
            You see the gift. Never the giver.
          </h2>
          <p className="mt-3 max-w-lg text-ink-soft lg:max-w-xl lg:text-lg">
            Anonymous claiming is the point. The owner and the guest get two different views of the same list.
          </p>
        </FadeIn>
        <Stagger className="landing-privacy-grid" delay={0.08}>
          <StaggerItem className="landing-privacy-card">
            <p className="landing-kicker">You see</p>
            <h3 className="mt-2 font-display text-2xl">What’s taken</h3>
            <p className="mt-2 text-ink-soft">
              Claimed gifts are marked Taken so you know what still needs covering. The name behind each claim stays hidden.
            </p>
          </StaggerItem>
          <StaggerItem className="landing-privacy-card">
            <p className="landing-kicker">Guests see</p>
            <h3 className="mt-2 font-display text-2xl">What’s still open</h3>
            <p className="mt-2 text-ink-soft">
              Friends pick an open gift and claim it privately. Other guests see Taken. Nobody else sees that it was them.
            </p>
          </StaggerItem>
        </Stagger>
      </section>

      <section id="occasions" className="landing-section landing-occasions-wrap" aria-labelledby="occasions-heading">
        <div className="shell">
          <FadeIn>
            <p className="landing-kicker">When to use it</p>
            <h2 id="occasions-heading" className="font-display text-3xl tracking-tight sm:text-4xl lg:text-5xl">
              For every kind of gift moment.
            </h2>
            <p className="mt-3 max-w-lg text-ink-soft lg:max-w-xl lg:text-lg">
              One private list works for celebrations, family holidays, and group presents.
            </p>
          </FadeIn>
          <Stagger className="landing-occasions" delay={0.06}>
            {occasions.map((occasion) => (
              <StaggerItem key={occasion.title} className="landing-occasion">
                <h3 className="font-display text-xl">{occasion.title}</h3>
                <p className="mt-1 text-sm text-ink-soft">{occasion.body}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section id="how" className="landing-how shell">
        <FadeIn>
          <p className="landing-kicker">How it works</p>
          <h2 className="font-display text-3xl tracking-tight sm:text-4xl lg:text-5xl">
            Three quiet steps.
          </h2>
          <p className="mt-3 max-w-lg text-ink-soft lg:max-w-xl lg:text-lg">
            From empty list to shared gifts without the awkward duplicates.
          </p>
        </FadeIn>
        <Stagger className="landing-steps" delay={0.1}>
          {steps.map((step) => (
            <StaggerItem key={step.n} className="landing-step">
              <div className="landing-step-mark">
                <span className="landing-step-icon">{step.icon}</span>
                <span className="landing-step-num">{step.n}</span>
              </div>
              <div>
                <h3 className="font-display text-2xl">{step.title}</h3>
                <p className="mt-2 text-ink-soft">{step.body}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      <section className="landing-close">
        <FadeIn className="shell text-center">
          <h2 className="font-display text-3xl tracking-tight sm:text-4xl lg:text-5xl">
            Ready when they are.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-ink-soft lg:max-w-lg lg:text-lg">
            Make a registry in under a minute.
          </p>
          <Button
            size="lg"
            className="mt-8 landing-close-cta"
            onClick={() => router.push(startHref)}
          >
            {signedIn ? "Go to my lists" : "Create your Givy"}
          </Button>
        </FadeIn>
      </section>
      </main>

      <footer className="landing-footer shell">
        <p>
          © {new Date().getFullYear()} Wejdan Al Amri · Givy · All rights reserved
        </p>
        <nav className="landing-footer-links" aria-label="Legal">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/delete-account">Delete account</Link>
        </nav>
      </footer>
    </div>
  );
}
