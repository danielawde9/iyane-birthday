import { describe, it, expect } from "vitest";
import { evaluateWindow, MemoryRateLimiter } from "./ratelimit";

describe("evaluateWindow", () => {
  it("allows when under the limit", () => {
    const r = evaluateWindow([], 1000, 1000, 3);
    expect(r.allowed).toBe(true);
    expect(r.remaining).toBe(2);
  });

  it("blocks once the limit is reached and reports retry time", () => {
    const ts = [200, 400, 600];
    const r = evaluateWindow(ts, 1000, 1000, 3);
    expect(r.allowed).toBe(false);
    expect(r.remaining).toBe(0);
    // oldest (200) + window (1000) - now (1000) = 200ms until a slot frees
    expect(r.retryAfterMs).toBe(200);
  });

  it("ignores timestamps outside the window", () => {
    const ts = [10, 20, 30]; // all older than now-window
    const r = evaluateWindow(ts, 5000, 1000, 3);
    expect(r.allowed).toBe(true);
  });
});

describe("MemoryRateLimiter", () => {
  it("allows up to the limit then blocks, and recovers after the window", () => {
    const limiter = new MemoryRateLimiter(1000, 2);
    expect(limiter.check("ip", 0).allowed).toBe(true);
    expect(limiter.check("ip", 100).allowed).toBe(true);
    expect(limiter.check("ip", 200).allowed).toBe(false);
    // after the window passes, the early hits expire
    expect(limiter.check("ip", 1300).allowed).toBe(true);
  });

  it("tracks keys independently", () => {
    const limiter = new MemoryRateLimiter(1000, 1);
    expect(limiter.check("a", 0).allowed).toBe(true);
    expect(limiter.check("b", 0).allowed).toBe(true);
    expect(limiter.check("a", 0).allowed).toBe(false);
  });
});
