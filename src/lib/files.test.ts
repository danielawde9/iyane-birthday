import { describe, it, expect } from "vitest";
import { sniffImageMime, validateUpload } from "./files";

function withHeader(header: number[], length = 16): Uint8Array {
  const bytes = new Uint8Array(length);
  bytes.set(header, 0);
  return bytes;
}

const JPEG = withHeader([0xff, 0xd8, 0xff, 0xe0]);
const PNG = withHeader([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const GIF = withHeader([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
const WEBP = withHeader([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]);

describe("sniffImageMime", () => {
  it("detects jpeg/png/gif/webp by magic bytes", () => {
    expect(sniffImageMime(JPEG)).toBe("image/jpeg");
    expect(sniffImageMime(PNG)).toBe("image/png");
    expect(sniffImageMime(GIF)).toBe("image/gif");
    expect(sniffImageMime(WEBP)).toBe("image/webp");
  });
  it("rejects non-image bytes and too-short buffers", () => {
    expect(sniffImageMime(withHeader([0x00, 0x01, 0x02, 0x03]))).toBeNull();
    expect(sniffImageMime(new Uint8Array([0xff, 0xd8]))).toBeNull();
  });
});

describe("validateUpload", () => {
  it("accepts a valid jpeg within size", () => {
    expect(validateUpload({ size: 1000, bytes: JPEG })).toEqual({ ok: true, mime: "image/jpeg" });
  });
  it("rejects empty files", () => {
    expect(validateUpload({ size: 0, bytes: JPEG }).ok).toBe(false);
  });
  it("rejects oversized files", () => {
    expect(validateUpload({ size: 100, bytes: JPEG, maxBytes: 50 }).ok).toBe(false);
  });
  it("rejects a file whose bytes are not an image", () => {
    const res = validateUpload({ size: 1000, bytes: withHeader([0x25, 0x50, 0x44, 0x46]) }); // %PDF
    expect(res.ok).toBe(false);
  });
});
