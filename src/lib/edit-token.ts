import { randomBytes, createHash, timingSafeEqual } from "node:crypto";

/**
 * Per-row capability tokens.
 *
 * A guest has no account. When they upload a photo or sign the guestbook the
 * server mints 32 random bytes, stores ONLY `sha256(token)` on the row, and
 * hands the raw token back exactly once. Holding that token is the entire
 * authorization story for that one row: it grants editing its text and
 * soft-removing it, and nothing else.
 *
 * The raw token is a bearer secret. It is never logged, never placed in a URL,
 * path segment, or query string — it travels in a request header only.
 */

/** Request header carrying the raw capability token. */
export const EDIT_TOKEN_HEADER = "x-edit-token";

const HASH_BYTES = 32; // sha256 → 32 bytes → 64 hex chars
const HEX_DIGEST = /^[0-9a-f]{64}$/;

export function hashEditToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

/** Mint a new token. The caller stores `hash` and returns `token` to the guest once. */
export function createEditToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashEditToken(token) };
}

/**
 * Constant-time check of a presented token against a stored hash.
 *
 * Both operands are fixed-width sha256 digests, so `timingSafeEqual` never sees
 * a length mismatch and the comparison leaks nothing about the stored hash. A
 * missing token, a non-string token, or a row with no stored hash all return
 * false — rows created before this feature shipped are uneditable by design.
 */
export function verifyEditToken(token: unknown, storedHash: string | null | undefined): boolean {
  if (typeof token !== "string" || token.length === 0) return false;
  if (!storedHash || !HEX_DIGEST.test(storedHash)) return false;

  const presented = Buffer.from(hashEditToken(token), "hex");
  const stored = Buffer.from(storedHash, "hex");
  if (presented.length !== HASH_BYTES || stored.length !== HASH_BYTES) return false;
  return timingSafeEqual(presented, stored);
}
