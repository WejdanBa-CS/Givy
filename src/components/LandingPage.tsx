"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogoMark } from "@/components/Logo";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { useGivy } from "@/lib/givy-context";

export function LandingPage() {
  const router = useRouter();
  const { user, ready } = useGivy();
  const primaryHref = ready && user ? "/app" : "/login";

  return (
    <div className="landing min-h-screen bg-mist text-ink">
      <header className="landing-nav">
        <Link href="/" className="inline-flex items-center gap-2.5" aria-label="Givy home">
          <LogoMark size={36} />
          <span className="font-display text-xl font-semibold tracking-tight">Givy</span>
        </Link>
        <Button asChild variant="ghost" size="sm" className="text-inherit">
          <Link href={primaryHref}>
            {ready && user ? "My lists" : "Sign in"}
          </Link>
        </Button>
      </header>

      <section className="landing-hero" aria-label="Givy">
        <div className="landing-hero-media" aria-hidden>
          {/*
            Static AVIF/WebP/JPEG (not /_next/image) for LCP on cold hosts:
            precompressed sources + matching preload in root layout.
          */}
          <picture>
            <source srcSet="/givy-hero.avif" type="image/avif" />
            <source srcSet="/givy-hero.webp" type="image/webp" />
            <img
              src="/givy-hero.jpg"
              alt=""
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
            <h1 className="landing-headline">
              One list. Zero awkward duplicates.
            </h1>
          </FadeIn>
          <FadeIn delay={0.22}>
            <p className="landing-lede">
              Share a private wishlist. Friends claim gifts anonymously.
            </p>
          </FadeIn>
          <FadeIn delay={0.32} className="landing-cta">
            <Button size="lg" onClick={() => router.push(primaryHref)}>
              {ready && user ? "Open my lists" : "Start free"}
            </Button>
            <Button asChild size="lg" variant="secondary" className="landing-cta-secondary">
              <a href="#how">How it works</a>
            </Button>
          </FadeIn>
        </div>
      </section>

      <section id="how" className="landing-how shell">
        <FadeIn>
          <h2 className="font-display text-3xl tracking-tight sm:text-4xl lg:text-5xl">
            How it works
          </h2>
          <p className="mt-3 max-w-lg text-ink-soft lg:max-w-xl lg:text-lg">
            From empty list to shared gifts in three quiet steps.
          </p>
        </FadeIn>
        <Stagger className="landing-steps" delay={0.1}>
          {[
            {
              n: "01",
              title: "Create a list",
              body: "Add ideas with links and prices for birthdays, weddings, and more.",
            },
            {
              n: "02",
              title: "Share one link",
              body: "Send it to friends and family. Anyone can open it.",
            },
            {
              n: "03",
              title: "They claim in private",
              body: "You see what’s taken. You never see who bought it.",
            },
          ].map((step) => (
            <StaggerItem key={step.n} className="landing-step">
              <span className="landing-step-num">{step.n}</span>
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
            onClick={() => router.push(primaryHref)}
          >
            {ready && user ? "Go to my lists" : "Create your Givy"}
          </Button>
        </FadeIn>
      </section>

      <footer className="shell border-t border-line/80 py-8 text-center text-sm text-ink-soft">
        © {new Date().getFullYear()} Givy ·{" "}
        <Link href="/privacy" className="underline-offset-2 hover:underline">
          Privacy
        </Link>{" "}
        ·{" "}
        <Link href="/terms" className="underline-offset-2 hover:underline">
          Terms
        </Link>
      </footer>
    </div>
  );
}
