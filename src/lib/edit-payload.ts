import { z } from "zod";

/**
 * The boundary for guest PATCH bodies.
 *
 * Two independent gates, because this is the surface that decides which columns
 * a stranger's JSON can reach:
 *
 *  1. A strict Zod object — an unknown key is a hard error, not a silently
 *     stripped one. Sending `status` or `featured` is a 400, so a guest gets
 *     told no rather than quietly ignored.
 *  2. The emitted payload is built key-by-key into snake_case columns. Even if
 *     the schema above regressed, nothing outside the allow-list can be written.
 */

const optionalText = (max: number) => z.string().max(max).nullish();
const requiredText = (max: number) => z.string().trim().min(1).max(max);

// `.max()` runs before the trim below, so a caption padded past the cap is
// rejected rather than silently squeezed under it.
const photoEditSchema = z
  .strictObject({
    caption: optionalText(140),
    uploaderName: optionalText(60),
  })
  .refine((v) => v.caption !== undefined || v.uploaderName !== undefined, {
    message: "nothing_to_update",
  });

const guestbookEditSchema = z
  .strictObject({
    name: requiredText(80).optional(),
    message: requiredText(400).optional(),
  })
  .refine((v) => v.name !== undefined || v.message !== undefined, {
    message: "nothing_to_update",
  });

export type ParsedEdit =
  | { ok: true; columns: Record<string, unknown> }
  | { ok: false; error: string };

/** Trimmed text, or null when the guest cleared the field. */
function nullableText(value: string | null | undefined): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function parsePhotoEdit(body: unknown): ParsedEdit {
  const parsed = photoEditSchema.safeParse(body);
  if (!parsed.success) return { ok: false, error: "invalid_patch" };

  const columns: Record<string, unknown> = {};
  if (parsed.data.caption !== undefined) columns.caption = nullableText(parsed.data.caption);
  if (parsed.data.uploaderName !== undefined) columns.uploader_name = nullableText(parsed.data.uploaderName);
  return { ok: true, columns };
}

export function parseGuestbookEdit(body: unknown): ParsedEdit {
  const parsed = guestbookEditSchema.safeParse(body);
  if (!parsed.success) return { ok: false, error: "invalid_patch" };

  const columns: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) columns.name = parsed.data.name;
  if (parsed.data.message !== undefined) columns.message = parsed.data.message;
  return { ok: true, columns };
}
