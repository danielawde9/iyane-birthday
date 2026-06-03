/**
 * Best-effort client IP for rate-limit keying. Prefer `cf-connecting-ip` (set by
 * Cloudflare and not client-spoofable when traffic is forced through Cloudflare),
 * then `x-real-ip`, then the left-most `x-forwarded-for` as a last resort.
 */
export function getClientIp(headers: Headers): string {
  const cf = headers.get("cf-connecting-ip");
  if (cf) return cf.trim();
  const real = headers.get("x-real-ip");
  if (real) return real.trim();
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return "unknown";
}
