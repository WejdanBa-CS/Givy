export function createRateLimiter(windowMs: number, maxPerWindow: number) {
  const buckets = new Map<string, number[]>();

  return function allowRequest(key: string): boolean {
    const now = Date.now();
    const recent = (buckets.get(key) ?? []).filter((timestamp) => now - timestamp < windowMs);
    if (recent.length >= maxPerWindow) {
      buckets.set(key, recent);
      return false;
    }
    recent.push(now);
    buckets.set(key, recent);
    return true;
  };
}
