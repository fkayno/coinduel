/**
 * Lightweight in-process rate limiter — a fixed-window counter per key,
 * kept in a module-level Map. No external service (Redis/Upstash) since
 * the app runs as a single Node process; this is intentionally the
 * simplest thing that actually stops casual abuse (brute-force login
 * attempts, signup spam, queue/upload hammering).
 *
 * KNOWN LIMITATION: this state is per server instance, not shared. If
 * CoinDuel is ever deployed across multiple instances/regions, each
 * instance enforces its own limit independently (so the *effective* limit
 * is roughly limit × instance count) — move to a shared store (e.g.
 * Upstash Redis) at that point. Fine for a single-instance deployment.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Periodic sweep so the Map doesn't grow unbounded under sustained traffic
// from many distinct keys (IPs/userIds) — runs at most once per minute,
// lazily, off the hot path.
let lastSweep = Date.now();
function sweepExpired(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

/** Returns true if the request is allowed, false if the caller should be rejected (429). */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  sweepExpired(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

/**
 * Best-effort client IP from standard proxy headers (Vercel/most hosts set
 * x-forwarded-for). Falls back to a constant so unauthenticated routes
 * behind a proxy that strips this header still rate-limit (coarsely, as
 * one shared bucket) rather than silently not limiting at all.
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}
