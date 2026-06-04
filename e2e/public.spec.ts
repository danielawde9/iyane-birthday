import { test, expect } from "@playwright/test";
import { watchPageErrors } from "./helpers";

/**
 * Every public read route exercises the supabase-js read path. A broken timestamp
 * mapping shows up as an uncaught error / Next error overlay (status >= 400 or a
 * pageerror), so we assert the page renders cleanly with no uncaught exceptions.
 */
const ROUTES = ["/", "/gallery", "/archive", "/archive/1", "/guestbook", "/details"];

for (const route of ROUTES) {
  test(`public ${route} renders without server error or date crash`, async ({ page }) => {
    const errors = watchPageErrors(page);
    const res = await page.goto(route, { waitUntil: "domcontentloaded" });
    expect(res, `no response for ${route}`).not.toBeNull();
    expect(res!.status(), `HTTP status for ${route}`).toBeLessThan(400);
    await expect(page.locator("body")).not.toContainText("Invalid Date");
    expect(errors, `uncaught page errors on ${route}`).toEqual([]);
  });
}
