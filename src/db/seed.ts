import "./load-env";
import { eq } from "drizzle-orm";
import { getDb } from "./index";
import { events } from "./schema";

/** Seed the Year-1 "Iyane keepsake" event. Safe to re-run. Run with `npm run db:seed`. */
async function main() {
  const db = getDb();
  if (!db) {
    console.error("✗ DATABASE_URL is not set — nothing to seed. (The app runs in demo mode without it.)");
    process.exit(1);
  }

  const existing = await db.select().from(events).where(eq(events.year, 1));
  if (existing.length > 0) {
    console.log("✓ Year-1 event already exists — leaving it as is.");
    process.exit(0);
  }

  await db.insert(events).values({
    year: 1,
    themeSlug: "mr-onederful",
    title: "Iyane — Year One",
    eventDate: new Date("2026-07-15T16:00:00"),
    venue: "TBD",
    address: "Beirut, Lebanon",
    mapUrl: null,
    dressCode: "Dapper attire encouraged",
    heroCopy: "A page written by the room — every photograph here was placed by a guest.",
    isActive: true,
  });

  console.log("✓ Seeded the Year-1 'Iyane keepsake' event.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
