import { chromium, type Browser, type BrowserContext } from "@playwright/test";
import { mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

type Viewport = {
  name: string;
  width: number;
  height: number;
  deviceScaleFactor: number;
  isMobile: boolean;
  hasTouch: boolean;
};

const VIEWPORTS: Viewport[] = [
  { name: "mobile-375", width: 375, height: 812, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  { name: "tablet-768", width: 768, height: 1024, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  { name: "desktop-1440", width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
];

const ROUTES = ["/", "/gallery", "/upload", "/guestbook", "/details", "/archive", "/poster"];

const BASE_URL = process.env.SCREENSHOT_BASE_URL ?? "http://localhost:3000";
const OUT_ROOT = process.env.SCREENSHOT_OUT_DIR ?? "/tmp/iyane-responsive";

function fileNameFor(route: string): string {
  if (route === "/") return "_root_.png";
  return route.replace(/^\//, "").replace(/\//g, "_") + ".png";
}

async function ensureCleanDir(dir: string) {
  if (existsSync(dir)) await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
}

async function screenshotRoute(
  context: BrowserContext,
  route: string,
  viewport: Viewport,
  outDir: string,
): Promise<{ route: string; ok: boolean; status?: number; scrollWidth?: number; err?: string }> {
  const page = await context.newPage();
  try {
    const url = `${BASE_URL}${route}`;
    const resp = await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    const status = resp?.status() ?? 0;
    if (status >= 400) {
      await page.close();
      return { route, ok: false, status };
    }
    // Allow LivingGallery's first photo crossfade + QR canvas to settle.
    await page.waitForTimeout(route === "/" ? 1200 : 500);

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const out = path.join(outDir, fileNameFor(route));
    // Home is a `fixed inset-0` viewport — fullPage would be the viewport anyway.
    await page.screenshot({ path: out, fullPage: route !== "/" });
    return { route, ok: true, status, scrollWidth };
  } catch (err) {
    return { route, ok: false, err: err instanceof Error ? err.message : String(err) };
  } finally {
    if (!page.isClosed()) await page.close();
  }
}

async function main() {
  await ensureCleanDir(OUT_ROOT);
  const browser: Browser = await chromium.launch();
  const results: Array<{ viewport: string; route: string; ok: boolean; status?: number; scrollWidth?: number; err?: string }> = [];

  try {
    for (const vp of VIEWPORTS) {
      const dir = path.join(OUT_ROOT, vp.name);
      await mkdir(dir, { recursive: true });
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: vp.deviceScaleFactor,
        isMobile: vp.isMobile,
        hasTouch: vp.hasTouch,
        userAgent: vp.isMobile
          ? "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
          : undefined,
      });
      for (const route of ROUTES) {
        const r = await screenshotRoute(context, route, vp, dir);
        results.push({ viewport: vp.name, ...r });
        const tag = r.ok ? "OK" : `FAIL${r.status ? " " + r.status : ""}`;
        console.log(
          `[${vp.name}] ${route.padEnd(12)} ${tag}` +
            (r.scrollWidth ? `  scrollWidth=${r.scrollWidth}` : "") +
            (r.err ? `  ${r.err}` : ""),
        );
      }
      await context.close();
    }
  } finally {
    await browser.close();
  }

  const overflow = results.filter(
    (r) => r.ok && r.scrollWidth && r.viewport === "mobile-375" && r.scrollWidth > 375,
  );
  if (overflow.length > 0) {
    console.log("\nHorizontal overflow at 375 width:");
    for (const r of overflow) console.log(`  ${r.route} → scrollWidth=${r.scrollWidth}`);
  } else {
    console.log("\nNo horizontal overflow at 375 width.");
  }

  const failed = results.filter((r) => !r.ok);
  if (failed.length > 0) {
    console.log("\nFailures:");
    for (const r of failed) console.log(`  [${r.viewport}] ${r.route} ${r.status ?? ""} ${r.err ?? ""}`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
