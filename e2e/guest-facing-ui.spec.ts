import { test, expect } from "@playwright/test";

const UPLOADER_NAME_KEY = "iyane_uploader_name";

const ONE_BY_ONE_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
  "base64",
);

test("upload page shows a thank-you state after every selected image uploads", async ({ page }) => {
  await page.route("**/api/upload", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        photo: {
          id: "ui-upload-1",
          url: "https://example.com/photo.jpg",
          thumbUrl: "https://example.com/thumb.jpg",
          width: 1,
          height: 1,
          caption: null,
          uploaderName: "UI Guest",
          createdAt: new Date("2026-07-01T12:00:00.000Z").toISOString(),
        },
      }),
    });
  });

  await page.goto("/upload");
  await page.getByLabel("Your name").fill("UI Guest");
  await page.locator('input[type="file"]').setInputFiles({
    name: "memory.png",
    mimeType: "image/png",
    buffer: ONE_BY_ONE_PNG,
  });

  await expect(page.getByText("All images are uploaded, thank you")).toBeVisible();
  await expect(page.getByRole("link", { name: "See Gallery" })).toHaveAttribute("href", "/gallery");
  await expect(page.getByRole("link", { name: "Go Home" })).toHaveAttribute("href", "/");
  await expect(page.getByRole("button", { name: "Add More Photos" })).toBeVisible();
  await expect(page.getByText("Add your photographs")).toBeHidden();
});

test("guestbook reuses and clears the saved uploader name", async ({ page }) => {
  await page.addInitScript(
    ({ key, name }) => window.localStorage.setItem(key, name),
    { key: UPLOADER_NAME_KEY, name: "Tante Lara" },
  );

  await page.route("**/api/guestbook", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }

    const body = route.request().postDataJSON() as { name: string; message: string };
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        entry: {
          id: "ui-wish-1",
          name: body.name,
          message: body.message,
          createdAt: new Date("2026-07-01T12:00:00.000Z").toISOString(),
        },
      }),
    });
  });

  await page.goto("/guestbook");
  await expect(page.getByText("Signing as")).toBeVisible();
  await expect(page.getByText("Tante Lara")).toBeVisible();

  await page.getByLabel("Your message").fill("All the love for Iyane.");
  await page.getByRole("button", { name: "Sign the guestbook" }).click();

  await expect(page.locator("article").filter({ hasText: "All the love for Iyane." })).toBeVisible();
  await expect(page.locator("#gb-message")).toHaveValue("");
  await expect(page.evaluate((key) => window.localStorage.getItem(key), UPLOADER_NAME_KEY)).resolves.toBe("Tante Lara");

  await page.getByRole("button", { name: "Clear saved name" }).click();
  await expect(page.getByLabel("Your name")).toBeVisible();
  await expect(page.evaluate((key) => window.localStorage.getItem(key), UPLOADER_NAME_KEY)).resolves.toBeNull();
});

test("poster fills the mobile viewport width", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/poster");

  const box = await page.locator(".poster-article").boundingBox();
  expect(box).not.toBeNull();
  expect(Math.round(box!.x)).toBe(0);
  expect(Math.round(box!.width)).toBe(390);
});
