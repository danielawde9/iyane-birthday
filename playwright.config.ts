import { defineConfig, devices } from "@playwright/test";

/**
 * E2E suite that guards the supabase-js data layer end-to-end — especially that
 * PostgREST's ISO-string timestamps are mapped back to Dates (see e2e/README.md).
 *
 * The webServer starts `next dev` on :3015 with the dev bypasses the gated routes
 * need (admin auth + upload geo). It does NOT start Supabase — bring that up first:
 *   supabase start && npm run db:push && npm run db:seed && npm run db:bucket
 */
const PORT = 3015;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "ADMIN_DEV_BYPASS=1 UPLOAD_GEO_BYPASS=1 npm run dev",
    url: baseURL,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
    stdout: "ignore",
    stderr: "pipe",
  },
});
