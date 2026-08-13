import Link from "next/link";

export default function NotFound() {
  return (
    <main className="shell grid min-h-[70vh] place-items-center py-16 text-center">
      <div className="animate-rise">
        <p className="font-display text-5xl text-ink">404</p>
        <p className="mt-3 text-ink-soft">That page isn’t here.</p>
        <Link href="/" className="btn btn-primary mt-6">
          Back to Givy
        </Link>
      </div>
    </main>
  );
}
