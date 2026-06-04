import { test, expect } from "@playwright/test";
import { tinyPng } from "./helpers";

/**
 * Upload exercises the full write chain over HTTP: insertPhoto -> .select() ->
 * mapPhoto -> toPhotoDTO (which calls createdAt.toISOString()). Dev auto-bypasses the
 * geo gate (and the webServer sets UPLOAD_GEO_BYPASS=1). Requires the 'photos' bucket
 * (npm run db:bucket) since storage is configured locally.
 */
test("POST /api/upload stores a photo and returns a DTO with ISO createdAt", async ({ request }) => {
  const res = await request.post("/api/upload", {
    multipart: {
      image: { name: "e2e.png", mimeType: "image/png", buffer: tinyPng() },
      width: "100",
      height: "100",
      uploaderName: "E2E Upload",
      caption: "e2e",
    },
  });
  // 200 success; 429 if rate-limited by a prior run. Anything else (esp. 500) means the
  // insert -> select -> mapPhoto -> toPhotoDTO chain broke.
  expect([200, 429]).toContain(res.status());
  if (res.status() === 200) {
    const body = await res.json();
    expect(body.ok).toBeTruthy();
    expect(Number.isNaN(Date.parse(body.photo.createdAt))).toBeFalsy();
  }
});
