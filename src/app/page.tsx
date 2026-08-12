"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Logo } from "@/components/Logo";
import { SiteHeader } from "@/components/SiteHeader";
import { useGivy } from "@/lib/givy-context";

export default function HomePage() {
  const { user, ready } = useGivy();
  const router = useRouter();

  useEffect(() => {
    if (ready && user) router.replace("/app");
  }, [ready, user, router]);

  return (
    <div className="shell pb-16">
      <SiteHeader />

      <main className="relative mt-6 min-h-[78vh] overflow-hidden rounded-[2rem] border border-line bg-[linear-gradient(135deg,rgba(255,255,255,0.55),rgba(231,241,234,0.35))] shadow-givy">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-90"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 80% 60% at 70% 45%, rgba(255,90,60,0.2), transparent 60%), radial-gradient(ellipse 50% 40% at 20% 70%, rgba(47,122,85,0.18), transparent 55%)",
          }}
        />

        <div className="relative grid gap-10 px-6 py-14 sm:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end lg:px-14 lg:py-16">
          <div className="animate-rise max-w-xl">
            <Logo size="hero" className="group" />
            <h1 className="mt-5 max-w-[18ch] text-2xl font-semibold leading-tight tracking-tight text-ink sm:text-3xl">
              One shared list for the gifts people actually want.
            </h1>
            <p className="mt-4 max-w-[36ch] text-base leading-relaxed text-ink-soft sm:text-lg">
              Birthdays, weddings, holidays — create a Givy, share the link, and let friends claim gifts without the awkward double-ups.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/login" className="btn btn-primary">
                Start a Givy
              </Link>
              <a href="#how" className="btn btn-secondary">
                See how it works
              </a>
            </div>
          </div>

          <div className="animate-float relative mx-auto w-full max-w-md lg:mx-0 lg:justify-self-end">
            <div className="panel overflow-hidden p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-leaf">
                    Birthday
                  </p>
                  <p className="font-display text-2xl text-ink">Alex&apos;s big day</p>
                </div>
                <span className="rounded-full bg-coral/10 px-3 py-1 text-xs font-bold text-coral-deep">
                  12 days
                </span>
              </div>
              <ul className="mt-5 space-y-3">
                {[
                  { title: "Wool beanie", price: "$28", done: true },
                  { title: "Snack care box", price: "$35", done: false },
                  { title: "Everyday watch", price: "$120", done: false },
                ].map((item) => (
                  <li
                    key={item.title}
                    className={`flex items-center justify-between rounded-2xl border border-line bg-paper/80 px-4 py-3 ${
                      item.done ? "gift-claimed" : ""
                    }`}
                  >
                    <span className="gift-title font-semibold">{item.title}</span>
                    <span className="text-sm text-ink-soft">
                      {item.done ? "Claimed" : item.price}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-ink-soft">
                Claimed gifts stay anonymous — just grayed out for everyone else.
              </p>
            </div>
          </div>
        </div>
      </main>

      <section id="how" className="mt-16 stagger">
        <h2 className="font-display text-3xl tracking-tight text-ink sm:text-4xl">
          Essentials, first.
        </h2>
        <p className="mt-2 max-w-xl text-ink-soft">
          Start with birthday lists. Layer on wedding registries, holidays, and local giveaways later.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Make a Givy",
              body: "Add the hat, socks, snacks, watch, gift card — whatever you actually want.",
            },
            {
              title: "Share the link",
              body: "Friends open it, pick something, and choose ship-to-them or ship-to-you.",
            },
            {
              title: "No double gifts",
              body: "Once claimed, the item is crossed off. Who bought it stays private.",
            },
          ].map((step) => (
            <article key={step.title} className="panel p-5">
              <h3 className="font-display text-xl text-ink">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{step.body}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
