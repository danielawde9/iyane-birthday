import { NextResponse } from "next/server";
import { isUploadGeoAllowed } from "./upload-auth";
import { getClientIp } from "./request";
import { writeLimiter } from "./ratelimit-instance";
import type { EditDenialCode } from "./edit-authz";

/**
 * The gate every guest-initiated write passes through, shared by the four
 * edit/remove handlers so they behave exactly like the POST routes they mirror.
 */

/**
 * Geo gate then rate limit, in that order — same as POST /api/upload.
 * Returns a response to send, or null to continue.
 *
 * `writeLimiter` (not `uploadLimiter`) because an edit or a removal is a small
 * text write, the same shape of work as posting a guestbook wish.
 */
export function guardGuestWrite(h: Headers): NextResponse | null {
  if (!isUploadGeoAllowed(h)) {
    return NextResponse.json(
      { error: "Photo uploads are open to guests celebrating in Lebanon 💛", code: "geo_locked" },
      { status: 403 },
    );
  }

  const limit = writeLimiter.check(getClientIp(h));
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Just a moment — that's a lot of changes at once!", code: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)) } },
    );
  }

  return null;
}

/**
 * One message for every denial. The guest is never told whether the id existed,
 * whether their token was wrong, or (unless they own the row) what the host has
 * done with it.
 */
export function denied(code: EditDenialCode): NextResponse {
  const message =
    code === "locked_by_host"
      ? "The host has taken this one down — message them if you'd like it back."
      : "This isn't editable from this browser.";
  return NextResponse.json({ error: message, code }, { status: 403 });
}

export function badPatch(): NextResponse {
  return NextResponse.json({ error: "That change isn't something you can edit.", code: "invalid_patch" }, { status: 400 });
}

/** Parse a JSON body without throwing on malformed input. */
export async function readJson(request: Request): Promise<unknown> {
  return request.json().catch(() => null);
}
