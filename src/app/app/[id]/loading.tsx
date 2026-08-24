export default function ListLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Opening list…</span>
      <div className="h-4 w-20 animate-pulse rounded bg-mist-deep" />
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-5">
          <div className="border-b border-line pb-5">
            <div className="h-3 w-28 animate-pulse rounded bg-mist-deep" />
            <div className="mt-3 h-10 w-3/4 animate-pulse rounded bg-mist-deep" />
            <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-mist-deep" />
          </div>
          <div className="space-y-1">
            {[0, 1, 2].map((item) => (
              <div key={item} className="grid grid-cols-[3rem_1fr] gap-4 border-b border-line py-5">
                <div className="h-12 w-12 animate-pulse rounded-2xl bg-mist-deep" />
                <div className="space-y-3"><div className="h-5 w-2/3 animate-pulse rounded bg-mist-deep" /><div className="h-4 w-full animate-pulse rounded bg-mist-deep" /></div>
              </div>
            ))}
          </div>
          <div className="panel space-y-3 p-5"><div className="h-6 w-40 animate-pulse rounded bg-mist-deep" /><div className="h-11 w-full animate-pulse rounded bg-mist-deep" /><div className="h-11 w-full animate-pulse rounded bg-mist-deep" /></div>
        </section>
        <aside className="hidden space-y-4 lg:block"><div className="panel h-44 animate-pulse bg-mist-deep" /><div className="panel h-64 animate-pulse bg-mist-deep" /></aside>
      </div>
    </div>
  );
}
