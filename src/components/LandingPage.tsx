"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Gift,
  Link2,
  Lock,
  Share2,
  Sparkles,
} from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { useGivy } from "@/lib/givy-context";

export function LandingPage() {
  const router = useRouter();
  const { user, ready } = useGivy();

  return (
    <div className="min-h-screen bg-mist text-ink" style={{ fontFamily: "var(--font-body)" }}>
      <header className="shell flex items-center justify-between py-5">
        <span className="inline-flex items-center gap-2.5">
          <LogoMark size={32} />
          <span className="font-display text-2xl font-semibold tracking-tight">Givy</span>
        </span>
        {ready && user ? (
          <Link href="/app" className="btn btn-primary !rounded-full !py-2.5 !px-5 text-sm">
            My lists
          </Link>
        ) : (
          <Link href="/login" className="btn btn-primary !rounded-full !py-2.5 !px-5 text-sm">
            Sign in
          </Link>
        )}
      </header>

      <main>
        <section className="shell grid items-center gap-12 pb-16 pt-10 lg:grid-cols-2 lg:pt-16">
          <div className="animate-rise">
            <span className="inline-flex items-center gap-2 rounded-full bg-amber px-3 py-1.5 text-xs font-black uppercase tracking-widest text-ink">
              <Sparkles size={11} /> Wishlists, done right
            </span>
            <h1 className="mt-6 font-display text-[clamp(2.8rem,6vw,4.5rem)] font-black leading-[1.05] tracking-tight">
              Gifts they&apos;ll actually{" "}
              <span className="italic text-coral">love.</span>
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-ink-soft">
              Build a list. Share one link. Friends claim gifts in private, so nobody
              buys the same thing twice.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => router.push(user ? "/app" : "/login")}
                className="btn btn-primary gap-3 !rounded-2xl !px-6 !py-4"
              >
                {user ? "Open my lists" : "Get started free"}
                <ArrowRight size={16} />
              </button>
              <a href="#how" className="btn btn-secondary !rounded-2xl !px-6 !py-4">
                See how it works
              </a>
            </div>
          </div>

          <div className="relative animate-rise">
            <div className="panel overflow-hidden border-2 p-0 shadow-none">
              <div className="border-b-2 border-line bg-mist-deep/60 px-5 py-4">
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-leaf">
                  Birthday · Jordan
                </p>
                <p className="mt-1 font-display text-2xl font-semibold">Jordan&apos;s wishlist</p>
              </div>
              <ul className="divide-y-2 divide-line">
                {[
                  { title: "Wool beanie", price: "$28", open: true },
                  { title: "Snack care box", price: "$35", open: false },
                  { title: "Everyday watch", price: "$120", open: true },
                ].map((item) => (
                  <li
                    key={item.title}
                    className={`flex items-center justify-between gap-3 px-5 py-4 ${
                      item.open ? "" : "opacity-45"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid h-11 w-11 place-items-center rounded-xl bg-mist-deep text-coral">
                        <Gift size={18} />
                      </span>
                      <div>
                        <p
                          className={`font-semibold ${
                            item.open ? "" : "line-through"
                          }`}
                        >
                          {item.title}
                        </p>
                        <p className="text-sm text-ink-soft">
                          {item.open ? "Open" : "Taken · anonymous"}
                        </p>
                      </div>
                    </div>
                    {item.open ? (
                      <span className="price-badge">{item.price}</span>
                    ) : (
                      <Lock size={16} className="text-ink-soft" />
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="how" className="border-y-2 border-line bg-paper/50 py-16">
          <div className="shell">
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              How Givy works
            </h2>
            <p className="mt-2 max-w-xl text-ink-soft">
              Three steps from empty list to zero awkward duplicates.
            </p>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {[
                {
                  icon: Gift,
                  title: "Create your list",
                  body: "Add gift ideas with links, prices, and notes for any occasion.",
                },
                {
                  icon: Share2,
                  title: "Share one link",
                  body: "Send a unique link to friends and family. No accounts needed to view.",
                },
                {
                  icon: Link2,
                  title: "Friends claim privately",
                  body: "They mark a gift as taken. You only see that it’s claimed, never who.",
                },
              ].map(({ icon: Icon, title, body }) => (
                <div key={title} className="panel p-6">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-coral/10 text-coral">
                    <Icon size={20} />
                  </span>
                  <h3 className="mt-4 font-display text-xl font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="shell py-16 text-center">
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Ready for your next occasion?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-ink-soft">
            Sign in and create a registry in under a minute.
          </p>
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="btn btn-primary mt-8 !rounded-2xl !bg-amber !px-8 !py-4 !text-ink hover:!opacity-90"
          >
            Create your Givy
            <ArrowRight size={16} />
          </button>
        </section>
      </main>

      <footer className="shell border-t-2 border-line py-8 text-center text-sm text-ink-soft">
        © {new Date().getFullYear()} Givy · gifts without the guesswork ·{" "}
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
