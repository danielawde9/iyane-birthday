import "./load-env";
import { eq } from "drizzle-orm";
import { getDb } from "./index";
import { events, photos } from "./schema";
import { DEMO_PHOTOS } from "./demo";

/**
 * Replace the active event's photos with the bundled stand-in photo set (served
 * from /public/demo) so the gallery looks real in local testing. Reuses the same
 * data as demo mode (see demo.ts). Run: npm run db:seed-photos
 */

async function main() {
  const db = getDb();
  if (!db) {
    console.error("✗ DATABASE_URL is not set.");
    process.exit(1);
  }
  const [event] = await db.select().from(events).where(eq(events.isActive, true)).limit(1);
  if (!event) {
    console.error("✗ No active event — run `npm run db:seed` first.");
    process.exit(1);
  }

  await db.delete(photos).where(eq(photos.eventId, event.id));
  for (const p of DEMO_PHOTOS) {
    await db.insert(photos).values({
      eventId: event.id,
      storageKey: p.storageKey,
      thumbKey: p.thumbKey,
      width: p.width,
      height: p.height,
      uploaderName: p.uploaderName,
      caption: p.caption,
      featured: p.featured,
      status: "visible",
    });
  }
  const guests = new Set(DEMO_PHOTOS.map((p) => p.uploaderName)).size;
  console.log(`✓ Seeded ${DEMO_PHOTOS.length} sample photos across ${guests} guests.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
