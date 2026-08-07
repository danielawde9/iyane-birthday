import { describe, it, expect } from "vitest";
import { createEditToken, hashEditToken, verifyEditToken, EDIT_TOKEN_HEADER } from "./edit-token";

describe("createEditToken", () => {
  it("returns a token and its sha256, never the token itself as the hash", () => {
    const { token, hash } = createEditToken();
    expect(hash).not.toBe(token);
    expect(hash).toBe(hashEditToken(token));
  });

  it("mints a 32-byte token as base64url (43 chars, url-safe)", () => {
    const { token } = createEditToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it("mints a different token every time", () => {
    const seen = new Set(Array.from({ length: 50 }, () => createEditToken().token));
    expect(seen.size).toBe(50);
  });

  it("hashes to 64 hex characters", () => {
    expect(hashEditToken("anything")).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("verifyEditToken", () => {
  it("accepts the token that produced the stored hash", () => {
    const { token, hash } = createEditToken();
    expect(verifyEditToken(token, hash)).toBe(true);
  });

  it("rejects a different token", () => {
    const { hash } = createEditToken();
    expect(verifyEditToken(createEditToken().token, hash)).toBe(false);
  });

  it("rejects a truncated token", () => {
    const { token, hash } = createEditToken();
    expect(verifyEditToken(token.slice(0, -1), hash)).toBe(false);
  });

  it("rejects when no token is presented", () => {
    const { hash } = createEditToken();
    expect(verifyEditToken(null, hash)).toBe(false);
    expect(verifyEditToken(undefined, hash)).toBe(false);
    expect(verifyEditToken("", hash)).toBe(false);
  });

  it("rejects a non-string token without throwing", () => {
    const { hash } = createEditToken();
    expect(verifyEditToken(42, hash)).toBe(false);
    expect(verifyEditToken({ token: "x" }, hash)).toBe(false);
  });

  // Rows created before this feature shipped have no hash. They are not editable
  // by anyone holding any token — fail closed.
  it("rejects every token when the row has no stored hash", () => {
    const { token } = createEditToken();
    expect(verifyEditToken(token, null)).toBe(false);
    expect(verifyEditToken(token, "")).toBe(false);
  });

  it("rejects a stored hash that is not a 64-char hex digest", () => {
    expect(verifyEditToken("tok", "not-a-hash")).toBe(false);
  });
});

describe("EDIT_TOKEN_HEADER", () => {
  it("is a lowercase header name (Headers.get is case-insensitive but we compare literals)", () => {
    expect(EDIT_TOKEN_HEADER).toBe(EDIT_TOKEN_HEADER.toLowerCase());
  });
});
