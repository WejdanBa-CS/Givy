import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata = {
  title: "Privacy · Givy",
  description: "How Givy collects, uses, and protects your information.",
};

export default function PrivacyPage() {
  return (
    <div className="pb-16">
      <div className="shell">
        <SiteHeader />
        <main className="mx-auto mt-10 max-w-2xl animate-rise">
          <h1 className="font-display text-4xl tracking-tight text-ink">Privacy</h1>
          <p className="mt-2 text-sm text-ink-soft">Last updated: August 14, 2026</p>

          <div className="prose-givy mt-8 space-y-6 text-[15px] leading-relaxed text-ink-soft">
            <p>
              Givy helps you create gift lists and share them privately. This policy
              explains what we collect and how we use it.
            </p>

            <section>
              <h2 className="font-display text-2xl text-ink">What we collect</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Account details from your sign-in provider (name, email, avatar).</li>
                <li>Lists, gift items, notes, and optional ship-to addresses you add.</li>
                <li>Claim records (that a gift was marked purchased—not who claimed it, for list owners).</li>
                <li>Basic technical logs needed to run and secure the service.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl text-ink">How we use it</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>To provide your account, lists, and share links.</li>
                <li>To reveal a shipping address only to a claimer who chooses “ship to recipient.”</li>
                <li>To keep claims anonymous from list owners.</li>
                <li>To improve reliability and prevent abuse.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl text-ink">Sharing</h2>
              <p className="mt-2">
                We do not sell your personal data. Shared list pages show gift ideas and
                claim status. Shipping addresses are never shown on the public list;
                they appear only after a successful claim with “ship to recipient.”
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl text-ink">Retention & deletion</h2>
              <p className="mt-2">
                We keep your data while your account is active. To request deletion of
                your account and associated lists, email{" "}
                <a className="font-semibold text-coral-deep underline-offset-2 hover:underline" href="mailto:hello@givy.app">
                  hello@givy.app
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl text-ink">Contact</h2>
              <p className="mt-2">
                Questions about privacy:{" "}
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
