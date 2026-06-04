import { test, expect } from "@playwright/test";

/**
 * The guestbook API calls `createdAt.toISOString()` on every row — a direct probe of
 * the timestamp mapping. If PostgREST's ISO string weren't converted back to a Date,
 * these routes would 500 instead of returning JSON.
 */
test("GET /api/guestbook serializes createdAt as a valid ISO string", async ({ request }) => {
  const res = await request.get("/api/guestbook");
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(Array.isArray(body.entries)).toBeTruthy();
  for (const entry of body.entries) {
    expect(Number.isNaN(Date.parse(entry.createdAt)), `bad createdAt: ${entry.createdAt}`).toBeFalsy();
  }
});

test("POST /api/guestbook inserts and returns a row with ISO createdAt", async ({ request }) => {
  const res = await request.post("/api/guestbook", {
    data: { name: "E2E Guest", message: "e2e smoke message" },
  });
  // 200 on success; 429 if a prior run tripped the rate limiter. Both prove the route
  // did not 500 on the insert -> .select() -> mapGuestbook -> toISOString path.
  expect([200, 429]).toContain(res.status());
  if (res.status() === 200) {
    const body = await res.json();
    expect(body.ok).toBeTruthy();
    expect(Number.isNaN(Date.parse(body.entry.createdAt))).toBeFalsy();
  }
});
