import { test, expect } from "@playwright/test";
import { watchPageErrors } from "./helpers";

/**
 * Admin exercises the PRIVILEGED (service-role) read path and the admin Date trap:
 * toLocalInput(event.eventDate) calls Date methods to fill the datetime-local input.
 *
 * The webServer starts dev with ADMIN_DEV_BYPASS=1 so /admin is reachable without a
 * real login. If that bypass isn't active, /admin redirects to /admin/login and the
 * test skips (rather than failing on an environment difference).
 */
test("admin dashboard loads and pre-fills a well-formed event date", async ({ page }) => {
  const errors = watchPageErrors(page);
  const res = await page.goto("/admin", { waitUntil: "domcontentloaded" });
  expect(res!.status()).toBeLessThan(400);

  test.skip(page.url().includes("/login"), "Admin auth enforced — run dev with ADMIN_DEV_BYPASS=1 to cover /admin");

  await expect(page.locator("body")).not.toContainText("Invalid Date");

  // A string eventDate would make toLocalInput emit "NaN-NaN-NaNTNaN:NaN".
  const dateInput = page.locator('input[type="datetime-local"]').first();
  if (await dateInput.count()) {
    const value = await dateInput.inputValue();
    if (value) expect(value, "datetime-local value should be well-formed").toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
  }
  expect(errors).toEqual([]);
});
