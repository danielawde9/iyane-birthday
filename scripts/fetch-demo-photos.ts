import { mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";

/**
 * Download a set of free-license Unsplash stock photos into `public/demo/`
 * for DEMO MODE (no database). Each photo is saved as a full JPEG (w=1600)
 * and a thumbnail JPEG (w=520). These are STAND-IN stock photos, not real
 * event photos.
 *
 * Run with: `npx tsx scripts/fetch-demo-photos.ts`
 *
 * If a photo URL fails (404/empty), it is skipped and the remaining photos
 * are renumbered so the final set is contiguous (01..N with no gaps). The
 * pixel dimensions of the seed data (src/db/demo.ts) must be kept in sync
 * with whatever ends up on disk.
 */

const OUT_DIR = join(process.cwd(), "public", "demo");

/** Unsplash photo ids in the desired display order (with intended guest names). */
const PHOTOS: { id: string; by: string }[] = [
  { id: "photo-1530103862676-de8c9debad1d", by: "Tante Layla" },
  { id: "photo-1464349095431-e9a21285b5f3", by: "Maya K." },
  { id: "photo-1513151233558-d860c5398176", by: "Jordan A." },
  { id: "photo-1492684223066-81342ee5ff30", by: "Auntie Rose" },
  { id: "photo-1496024840928-4c417adf211d", by: "Marcus T." },
  { id: "photo-1530021232320-687d8e3dba54", by: "Priya N." },
  { id: "photo-1414235077428-338989a2e8c0", by: "Sade O." },
  { id: "photo-1502635385003-ee1e6a1a742d", by: "Ben H." },
  { id: "photo-1485178575877-1a13bf489dfe", by: "Nikki D." },
  { id: "photo-1473773508845-188df298d2d1", by: "Daniel O." },
  { id: "photo-1517457373958-b7bdd4587205", by: "Yara M." },
  { id: "photo-1469371670807-013ccf25f16a", by: "Tomas L." },
  { id: "photo-1519671482749-fd09be7ccebf", by: "Aisha B." },
  { id: "photo-1467810563316-b5476525c0f9", by: "Léa P." },
  { id: "photo-1525183995014-bd94c0750cd5", by: "Theo R." },
  { id: "photo-1464366400600-7168b8af9bc3", by: "Mama Iyane" },
  { id: "photo-1518621736915-f3b1c41bfd00", by: "Oncle Pierre" },
  { id: "photo-1530023367847-a683933f4172", by: "Kiana W." },
  { id: "photo-1543007630-9710e4a00a20", by: "Felix S." },
  { id: "photo-1542838132-92c53300491e", by: "Amani G." },
  { id: "photo-1496843916299-590492c751f4", by: "Rita V." },
  { id: "photo-1505236858219-8359eb29e329", by: "Hugo M." },
  { id: "photo-1478145046317-39f10e56b5e9", by: "Selma K." },
  { id: "photo-1486693128850-a77436e7ba3c", by: "Camille D." },
];

const FULL_URL = (id: string) =>
  `https://images.unsplash.com/${id}?w=1600&auto=format&fit=crop&q=80`;
const THUMB_URL = (id: string) =>
  `https://images.unsplash.com/${id}?w=520&auto=format&fit=crop&q=70`;

const pad = (n: number) => String(n).padStart(2, "0");

async function fetchJpeg(url: string): Promise<Buffer> {
  const res = await fetch(url, {
    headers: { Accept: "image/jpeg,image/*" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  // Guard against empty/placeholder responses.
  if (buf.byteLength < 1024) throw new Error(`Too small (${buf.byteLength}B) for ${url}`);
  return buf;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const skipped: string[] = [];
  let index = 0; // 0-based; becomes 1-based contiguous numbering on disk

  for (const { id } of PHOTOS) {
    try {
      const [full, thumb] = await Promise.all([
        fetchJpeg(FULL_URL(id)),
        fetchJpeg(THUMB_URL(id)),
      ]);
      index += 1;
      const nn = pad(index);
      await writeFile(join(OUT_DIR, `photo-${nn}.jpg`), full);
      await writeFile(join(OUT_DIR, `thumb-${nn}.jpg`), thumb);
      console.log(`✓ ${nn}  ${id}  (full ${(full.byteLength / 1024).toFixed(0)}KB, thumb ${(thumb.byteLength / 1024).toFixed(0)}KB)`);
    } catch (err) {
      skipped.push(id);
      console.warn(`✗ skipped ${id}: ${(err as Error).message}`);
    }
  }

  // Remove any stale higher-numbered files from a previous (larger) run so the
  // set on disk is exactly contiguous 01..index.
  for (let i = index + 1; i <= PHOTOS.length; i++) {
    const nn = pad(i);
    await rm(join(OUT_DIR, `photo-${nn}.jpg`), { force: true });
    await rm(join(OUT_DIR, `thumb-${nn}.jpg`), { force: true });
  }

  console.log(`\nDownloaded ${index} photo(s) to ${OUT_DIR}`);
  if (skipped.length) console.log(`Skipped (${skipped.length}): ${skipped.join(", ")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
