import { MemoryRateLimiter } from "./ratelimit";

/**
 * Shared per-instance limiters. On serverless these are per-instance (not global),
 * which is sufficient behind the geo + PIN gates for a party site. Swap in Upstash
 * for strict cross-instance limits at higher scale.
 */
export const uploadLimiter = new MemoryRateLimiter(60_000, 12); // 12 uploads / minute / IP
export const writeLimiter = new MemoryRateLimiter(60_000, 8); // 8 RSVP/guestbook writes / minute / IP
