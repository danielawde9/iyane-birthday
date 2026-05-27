/**
 * Party-PIN gate primitives.
 *
 * Guests unlock uploads with a shared PIN. We never trust the client after that:
 * a successful unlock issues a short-lived HMAC-SHA256 signed token that is stored
 * in an HttpOnly cookie and re-verified on every upload. Pure + isomorphic (Web
 * Crypto) so the same code runs in route handlers and tests.
 */

const encoder = new TextEncoder();

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/") + "===".slice((value.length + 3) % 4);
  const binary = atob(padded);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

async function hmacSha256(secret: string, data: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return new Uint8Array(signature);
}

/** Constant-time string comparison to avoid leaking length-prefix matches via timing. */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

/** Compare a submitted PIN against the expected one (constant time). */
export function verifyPin(submitted: unknown, expected: string | undefined): boolean {
  if (!expected) return false;
  if (typeof submitted !== "string" || submitted.length === 0) return false;
  if (submitted.length !== expected.length) return false;
  return timingSafeEqual(submitted, expected);
}

/** Create a `payload.signature` token that expires `ttlMs` from `now`. */
export async function signUploadToken(secret: string, ttlMs: number, now: number = Date.now()): Promise<string> {
  const payload = bytesToBase64Url(encoder.encode(JSON.stringify({ exp: now + ttlMs })));
  const signature = bytesToBase64Url(await hmacSha256(secret, payload));
  return `${payload}.${signature}`;
}

/** Validate signature + expiry of an upload token. */
export async function verifyUploadToken(
  token: string | undefined | null,
  secret: string | undefined,
  now: number = Date.now(),
): Promise<boolean> {
  if (!token || !secret) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payload, signature] = parts;
  const expected = bytesToBase64Url(await hmacSha256(secret, payload));
  if (!timingSafeEqual(signature, expected)) return false;
  try {
    const data = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payload))) as { exp?: unknown };
    return typeof data.exp === "number" && now <= data.exp;
  } catch {
    return false;
  }
}
