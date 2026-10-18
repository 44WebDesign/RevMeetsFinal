import { fail } from "./api";

// Lightweight in-memory rate limiter. Best-effort only: serverless instances
// don't share memory, so this throttles bursts per instance rather than giving
// a global guarantee — enough to blunt brute-force and spam at launch without a
// Redis dependency. Swap the store for Upstash/Redis later for a hard limit.

type Entry = { count: number; resetAt: number };
const store = new Map<string, Entry>();

export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

function hit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  // Opportunistic cleanup so the map can't grow without bound.
  if (store.size > 5000) {
    for (const [k, v] of store) if (v.resetAt <= now) store.delete(k);
  }
  const e = store.get(key);
  if (!e || e.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  e.count++;
  if (e.count > limit) return { ok: false, retryAfter: Math.ceil((e.resetAt - now) / 1000) };
  return { ok: true, retryAfter: 0 };
}

// Returns a 429 Response when the caller is over the limit, or null to proceed.
// `name` scopes the limit per endpoint; the client IP keys it per visitor.
export function rateLimited(
  req: Request,
  name: string,
  limit: number,
  windowMs: number,
): Response | null {
  const { ok, retryAfter } = hit(`${name}:${clientIp(req)}`, limit, windowMs);
  if (ok) return null;
  return fail(`Too many requests — please wait ${retryAfter}s and try again.`, 429);
}
