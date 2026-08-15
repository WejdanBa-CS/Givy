import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata = {
  title: "Delete account · Givy",
  description:
    "Request deletion of your Givy account and associated personal data.",
};

const DELETE_MAIL =
  "mailto:hello@givy.app?subject=" +
  encodeURIComponent("Givy account deletion request") +
  "&body=" +
  encodeURIComponent(
    "Please delete my Givy account and associated data.\n\nAccount email:\n\nAdditional notes (optional):\n",
  );

export default function DeleteAccountPage() {
  return (
    <div className="pb-16">
      <div className="shell">
        <SiteHeader />
        <main className="mx-auto mt-10 max-w-2xl animate-rise">
          <h1 className="font-display text-4xl tracking-tight text-ink">
            Delete your account
          </h1>
          <p className="mt-2 text-sm text-ink-soft">
            Request removal of your Givy account and associated data.
          </p>

          <div className="mt-8 space-y-6 text-[15px] leading-relaxed text-ink-soft">
            <p>
              You can ask us to delete your account, gift lists, claim records
              tied to your account, and related profile data.
            </p>

            <section>
              <h2 className="font-display text-2xl text-ink">How to request</h2>
              <ol className="mt-2 list-decimal space-y-2 pl-5">
                <li>
                  Tap the button below to email{" "}
                  <span className="font-semibold text-ink">hello@givy.app</span>
                  .
                </li>
                <li>
                  Include the email address on your Givy account so we can find
                  it.
                </li>
                <li>
                  We aim to complete deletion within 30 days and will confirm by
                  email when done.
                </li>
              </ol>
            </section>

            <a href={DELETE_MAIL} className="btn btn-primary inline-flex">
              Request account deletion
            </a>

            <section>
              <h2 className="font-display text-2xl text-ink">What we delete</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Your profile and sign-in association for Givy</li>
                <li>Lists and items you own</li>
                <li>Account-linked activity needed only for your account</li>
              </ul>
              <p className="mt-3">
                We may keep limited records when required for security, abuse
                prevention, or legal obligations.
              </p>
            </section>

            <p>
              Guest sessions only live in this browser — use Sign out / clear
              site data to remove them locally. See also our{" "}
              <Link
                href="/privacy"
                className="font-semibold text-coral-deep underline-offset-2 hover:underline"
              >
                Privacy
              </Link>{" "}
              policy.
            </p>
          </div>

          <Link href="/" className="btn btn-secondary mt-10">
            Back to Givy
          </Link>
        </main>
      </div>
    </div>
  );
}
