export default function AppLoading() {
  return (
    <div className="shell space-y-6 pb-28 pt-6 lg:pb-32" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading your Givy workspace…</span>
      <div className="flex items-center justify-between">
        <div className="h-8 w-28 animate-pulse rounded-lg bg-mist-deep" />
        <div className="h-9 w-9 animate-pulse rounded-full bg-mist-deep" />
      </div>
      <div className="space-y-3">
        <div className="h-4 w-24 animate-pulse rounded bg-mist-deep" />
        <div className="h-9 w-3/5 animate-pulse rounded bg-mist-deep" />
        <div className="h-4 w-2/5 animate-pulse rounded bg-mist-deep" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="panel space-y-4 p-5">
            <div className="h-5 w-2/3 animate-pulse rounded bg-mist-deep" />
            <div className="h-4 w-full animate-pulse rounded bg-mist-deep" />
            <div className="h-4 w-4/5 animate-pulse rounded bg-mist-deep" />
          </div>
        ))}
      </div>
    </div>
  );
}
