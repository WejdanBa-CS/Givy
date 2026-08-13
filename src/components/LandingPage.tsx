"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogoMark } from "@/components/Logo";
import { useGivy } from "@/lib/givy-context";

export function LandingPage() {
  const router = useRouter();
  const { user, ready } = useGivy();
  const primaryHref = ready && user ? "/app" : "/login";

  return (
    <div className="landing min-h-screen bg-mist text-ink">
      <header className="landing-nav">
        <Link href="/" className="inline-flex items-center gap-2.5" aria-label="Givy home">
          <LogoMark size={28} />
          <span className="font-display text-xl font-semibold tracking-tight">Givy</span>
        </Link>
        <Link href={primaryHref} className="btn btn-ghost text-sm font-bold">
          {ready && user ? "My lists" : "Sign in"}
        </Link>
      </header>

      <section className="landing-hero" aria-label="Givy">
        <div className="landing-hero-media" aria-hidden>
          <Image
            src="/givy-hero.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="landing-hero-veil" />
        </div>

        <div className="landing-hero-copy shell">
          <p className="landing-brand font-display animate-rise">Givy</p>
          <h1 className="landing-headline animate-rise-delay-1">
            One list. Zero awkward duplicates.
          </h1>
          <p className="landing-lede animate-rise-delay-2">
            Share a private wishlist. Friends claim gifts anonymously.
          </p>
          <div className="landing-cta animate-rise-delay-3">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => router.push(primaryHref)}
            >
              {ready && user ? "Open my lists" : "Start free"}
            </button>
            <a href="#how" className="btn btn-secondary landing-cta-secondary">
              How it works
            </a>
          </div>
        </div>
      </section>

      <section id="how" className="landing-how shell">
        <h2 className="font-display text-3xl tracking-tight sm:text-4xl">
          How it works
        </h2>
        <p className="mt-3 max-w-lg text-ink-soft">
          From empty list to shared gifts in three quiet steps.
        </p>
        <ol className="landing-steps">
          <li className="landing-step">
            <span className="landing-step-num">01</span>
            <div>
              <h3 className="font-display text-2xl">Create a list</h3>
              <p className="mt-2 text-ink-soft">
                Add ideas with links and prices for birthdays, weddings, and more.
              </p>
            </div>
          </li>
          <li className="landing-step">
            <span className="landing-step-num">02</span>
            <div>
              <h3 className="font-display text-2xl">Share one link</h3>
              <p className="mt-2 text-ink-soft">
                Send it to friends and family. Anyone can open it.
              </p>
            </div>
          </li>
          <li className="landing-step">
            <span className="landing-step-num">03</span>
            <div>
              <h3 className="font-display text-2xl">They claim in private</h3>
              <p className="mt-2 text-ink-soft">
                You see what’s taken. You never see who bought it.
              </p>
            </div>
          </li>
        </ol>
      </section>

      <section className="landing-close">
        <div className="shell text-center">
          <h2 className="font-display text-3xl tracking-tight sm:text-4xl">
            Ready when they are.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-ink-soft">
            Make a registry in under a minute.
          </p>
          <button
            type="button"
            className="btn btn-primary mt-8"
            onClick={() => router.push(primaryHref)}
          >
            {ready && user ? "Go to my lists" : "Create your Givy"}
          </button>
        </div>
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
