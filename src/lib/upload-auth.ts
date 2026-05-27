import { env } from "./env";

/** Name of the HttpOnly cookie holding the signed upload token. */
export const UPLOAD_COOKIE = "iyane_upload";

/**
 * The party-code gate is OPTIONAL. It's on only when UPLOAD_PIN is set
 * (or UPLOAD_REQUIRE_PIN=1). With no PIN, any guest who passes the Lebanon
 * geo-gate can upload without a code.
 */
export function isPinRequired(): boolean {
  if (process.env.UPLOAD_REQUIRE_PIN === "0") return false;
  if (process.env.UPLOAD_REQUIRE_PIN === "1") return true;
  return Boolean(env.uploadPin);
}

export function expectedUploadPin(): string | undefined {
  return env.uploadPin;
}
