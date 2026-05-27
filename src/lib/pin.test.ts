import { describe, it, expect } from "vitest";
import { signUploadToken, verifyUploadToken, verifyPin, timingSafeEqual } from "./pin";

const SECRET = "test-signing-key-please-rotate";

describe("timingSafeEqual", () => {
  it("matches equal strings and rejects different ones", () => {
    expect(timingSafeEqual("abc", "abc")).toBe(true);
    expect(timingSafeEqual("abc", "abd")).toBe(false);
    expect(timingSafeEqual("abc", "abcd")).toBe(false);
  });
});

describe("verifyPin", () => {
  it("accepts the correct PIN", () => {
    expect(verifyPin("1234", "1234")).toBe(true);
  });
  it("rejects wrong, empty, non-string, or missing expected", () => {
    expect(verifyPin("0000", "1234")).toBe(false);
    expect(verifyPin("", "1234")).toBe(false);
    expect(verifyPin(1234 as unknown as string, "1234")).toBe(false);
    expect(verifyPin("1234", undefined)).toBe(false);
  });
});

describe("upload token", () => {
  it("signs and verifies within its TTL", async () => {
    const token = await signUploadToken(SECRET, 10_000, 1_000);
    expect(await verifyUploadToken(token, SECRET, 5_000)).toBe(true);
  });

  it("rejects an expired token", async () => {
    const token = await signUploadToken(SECRET, 1_000, 1_000); // exp = 2000
    expect(await verifyUploadToken(token, SECRET, 3_000)).toBe(false);
  });

  it("rejects a tampered signature", async () => {
    const token = await signUploadToken(SECRET, 10_000, 1_000);
    const [payload] = token.split(".");
    expect(await verifyUploadToken(`${payload}.deadbeef`, SECRET, 5_000)).toBe(false);
  });

  it("rejects a tampered payload", async () => {
    const token = await signUploadToken(SECRET, 10_000, 1_000);
    const [, signature] = token.split(".");
    const forged = await signUploadToken(SECRET, 999_999, 1_000);
    const [forgedPayload] = forged.split(".");
    expect(await verifyUploadToken(`${forgedPayload}.${signature}`, SECRET, 5_000)).toBe(false);
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await signUploadToken("other-secret", 10_000, 1_000);
    expect(await verifyUploadToken(token, SECRET, 5_000)).toBe(false);
  });

  it("rejects malformed input", async () => {
    expect(await verifyUploadToken(undefined, SECRET)).toBe(false);
    expect(await verifyUploadToken("nodot", SECRET)).toBe(false);
    expect(await verifyUploadToken("a.b", undefined)).toBe(false);
  });
});
