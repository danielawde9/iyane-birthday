import type { Page } from "@playwright/test";

/** Collect uncaught page exceptions. A timestamp-mapping regression surfaces here. */
export function watchPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  return errors;
}

const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/** Minimal buffer that passes the server's PNG magic-byte sniff (needs >= 12 bytes). */
export function tinyPng(): Buffer {
  return Buffer.from([...PNG_MAGIC, 0, 0, 0, 0, 0, 0, 0, 0]); // 16 bytes
}
