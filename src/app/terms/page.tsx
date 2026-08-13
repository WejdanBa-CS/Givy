import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata = {
  title: "Terms · Givy",
  description: "Terms of use for the Givy gift list service.",
};

export default function TermsPage() {
  return (
    <div className="pb-16">
      <div className="shell">
        <SiteHeader />
        <main className="mx-auto mt-10 max-w-2xl animate-rise">
          <h1 className="font-display text-4xl tracking-tight text-ink">Terms</h1>
          <p className="mt-2 text-sm text-ink-soft">Last updated: August 14, 2026</p>

          <div className="mt-8 space-y-6 text-[15px] leading-relaxed text-ink-soft">
            <p>
              By using Givy you agree to these terms. If you do not agree, please do
              not use the service.
            </p>

            <section>
              <h2 className="font-display text-2xl text-ink">The service</h2>
              <p className="mt-2">
                Givy is a gift list and claim coordination tool. We help people share
                wishlists and avoid duplicate gifts. Purchases happen on third-party
                retailer sites, not on Givy.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl text-ink">Your account</h2>
              <p className="mt-2">
                You are responsible for activity under your account and for content you
                add (titles, links, notes, addresses). Do not upload illegal, harmful,
                or infringing material.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl text-ink">Claims & anonymity</h2>
              <p className="mt-2">
                Marking a gift as purchased is a coordination signal, not a purchase
                guarantee. List owners see that an item is taken, not who claimed it.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl text-ink">Disclaimer</h2>
              <p className="mt-2">
                Givy is provided as-is. We do not guarantee uninterrupted service or
                that retailer links will remain available. To the fullest extent
                allowed by law, we are not liable for indirect or consequential damages
                arising from use of the service.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl text-ink">Changes</h2>
              <p className="mt-2">
                We may update these terms. Continued use after changes means you accept
                the updated terms.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl text-ink">Contact</h2>
              <p className="mt-2">
                <a className="font-semibold text-coral-deep underline-offset-2 hover:underline" href="mailto:hello@givy.app">
                  hello@givy.app
                </a>
              </p>
            </section>
          </div>

          <Link href="/" className="btn btn-secondary mt-10">
            Back to Givy
          </Link>
        </main>
      </div>
    </div>
  );
}
