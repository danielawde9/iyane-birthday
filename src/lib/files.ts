/**
 * Server-side image validation. The client converts HEIC and compresses before
 * upload, so the server only needs to accept web image formats — and it must not
 * trust the declared content-type. We sniff magic bytes and cap the size.
 */

export const ALLOWED_IMAGE_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
export type AllowedMime = (typeof ALLOWED_IMAGE_MIME)[number];

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // 15 MB safety cap (client compresses well below this)

/** Identify an image by its leading bytes, or null if it isn't a supported image. */
export function sniffImageMime(bytes: Uint8Array): AllowedMime | null {
  if (bytes.length < 12) return null;
  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  // PNG: 89 50 4E 47
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  // GIF: 47 49 46 38
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) return "image/gif";
  // WEBP: "RIFF"...."WEBP"
  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

export type ValidationResult = { ok: true; mime: AllowedMime } | { ok: false; error: string };

/** Validate an uploaded image by size + sniffed type. */
export function validateUpload(opts: { size: number; bytes: Uint8Array; maxBytes?: number }): ValidationResult {
  const maxBytes = opts.maxBytes ?? MAX_UPLOAD_BYTES;
  if (opts.size <= 0) return { ok: false, error: "Empty file" };
  if (opts.size > maxBytes) {
    return { ok: false, error: `File too large (max ${Math.floor(maxBytes / 1024 / 1024)}MB)` };
  }
  const mime = sniffImageMime(opts.bytes);
  if (!mime) return { ok: false, error: "Unsupported or invalid image file" };
  return { ok: true, mime };
}

/** File extension for a sniffed mime, used to build storage keys. */
export function extensionFor(mime: AllowedMime): string {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
  }
}
