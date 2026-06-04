import { test, expect } from "@playwright/test";
import { watchPageErrors } from "./helpers";

/**
 * /details is the hardest Date-trap: it runs Intl.DateTimeFormat().format(eventDate),
 * which THROWS on a string. If the mapper failed to parse event_date into a Date this
 * route would 500 / show the error overlay rather than a formatted date.
 */
test("details page formats the event date without throwing", async ({ page }) => {
  const errors = watchPageErrors(page);
  const res = await page.goto("/details", { waitUntil: "domcontentloaded" });
  expect(res!.status()).toBeLessThan(400);
  await expect(page.locator("body")).not.toContainText("Invalid Date");
  await expect(page.locator("body")).not.toContainText("Application error");
  expect(errors).toEqual([]);
});
