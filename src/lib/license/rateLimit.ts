import "server-only";

/**
 * Minimal in-process fixed-window rate limiter for the license verification
 * endpoint. This is intentionally simple: it is process-local (does not
 * coordinate across multiple server instances) which is an accepted
 * limitation for the current single-instance deployment. If/when the
 * Control Center is horizontally scaled, replace this with a shared store
 * (e.g. Redis) — see docs/adr/0004-licensing-boundary.md.
 */

interface Bucket {
  count: number;
  windowStartedAt: number;
}

const buckets = new Map<string, Bucket>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 30;

export function checkRateLimit(key: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.windowStartedAt >= WINDOW_MS) {
    buckets.set(key, { count: 1, windowStartedAt: now });
    return { allowed: true };
  }

  if (bucket.count >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfterSeconds = Math.ceil((bucket.windowStartedAt + WINDOW_MS - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  bucket.count += 1;
  return { allowed: true };
}

// Prevent unbounded memory growth from one-off/unknown keys (e.g. IPs that
// never come back). Sweeps opportunistically rather than on a timer.
let lastSweep = Date.now();
export function maybeSweepRateLimitBuckets(): void {
  const now = Date.now();
  if (now - lastSweep < WINDOW_MS * 10) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (now - bucket.windowStartedAt >= WINDOW_MS) buckets.delete(key);
  }
}
