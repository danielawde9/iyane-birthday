/**
 * Sliding-window rate limiting.
 *
 * `evaluateWindow` is the pure decision used by both backends:
 *  - MemoryRateLimiter (demo mode / single instance / tests)
 *  - the Postgres-backed limiter in db/ratelimit.ts (production, serverless-safe)
 */

export interface RateResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

/** Given prior hit timestamps, decide if a new hit at `now` is allowed. */
export function evaluateWindow(
  timestamps: number[],
  now: number,
  windowMs: number,
  limit: number,
): RateResult {
  const cutoff = now - windowMs;
  const recent = timestamps.filter((t) => t > cutoff);
  const allowed = recent.length < limit;
  const remaining = Math.max(0, limit - recent.length - (allowed ? 1 : 0));
  let retryAfterMs = 0;
  if (!allowed && recent.length > 0) {
    const oldest = Math.min(...recent);
    retryAfterMs = Math.max(0, oldest + windowMs - now);
  }
  return { allowed, remaining, retryAfterMs };
}

/** In-memory limiter for demo mode and tests (not shared across serverless instances). */
export class MemoryRateLimiter {
  private store = new Map<string, number[]>();

  constructor(
    private readonly windowMs: number,
    private readonly limit: number,
  ) {}

  check(key: string, now: number = Date.now()): RateResult {
    const recent = (this.store.get(key) ?? []).filter((t) => t > now - this.windowMs);
    const result = evaluateWindow(recent, now, this.windowMs, this.limit);
    if (result.allowed) {
      recent.push(now);
      this.store.set(key, recent);
    }
    return result;
  }
}
