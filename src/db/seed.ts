import "./load-env";
import { eq } from "drizzle-orm";
import { getDb } from "./index";
import { events } from "./schema";
import { getDemoEvents } from "./demo";

/** Seed the demo "Iyane keepsake" events. Safe to re-run. Run with `npm run db:seed`. */
function isLocalDatabase(url = ""): boolean {
  return /(^|@|\b)(localhost|127\.0\.0\.1|\[::1\]|::1)(:|\/|$)/.test(url);
}

async function main() {
  const db = getDb();
  if (!db) {
    console.error("✗ DATABASE_URL is not set — nothing to seed. (The app runs in demo mode without it.)");
    process.exit(1);
  }

  const includeLocalTestYears =
    process.env.SEED_LOCAL_TEST_YEARS === "1" ||
    (process.env.NODE_ENV !== "production" &&
      process.env.VERCEL_ENV !== "production" &&
      isLocalDatabase(process.env.DATABASE_URL));
  const seedEvents = getDemoEvents({ includeLocalTestYears });

  if (!includeLocalTestYears) {
    console.log("ℹ Skipping local test archive years for this database.");
  }

  let inserted = 0;
  for (const event of seedEvents) {
    const existing = await db.select().from(events).where(eq(events.year, event.year));
    if (existing.length > 0) {
      if (event.year === 2) {
        await db
          .update(events)
          .set({
            themeSlug: event.themeSlug,
            title: event.title,
            eventDate: event.eventDate,
            venue: event.venue,
            address: event.address,
            mapUrl: event.mapUrl,
            dressCode: event.dressCode,
            heroCopy: event.heroCopy,
            isActive: event.isActive,
          })
          .where(eq(events.year, event.year));
        console.log(`✓ Updated Year-${event.year} demo event.`);
        continue;
      }
      console.log(`✓ Year-${event.year} event already exists — leaving it as is.`);
      continue;
    }

    await db.insert(events).values({
      year: event.year,
      themeSlug: event.themeSlug,
      title: event.title,
      eventDate: event.eventDate,
      venue: event.venue,
      address: event.address,
      mapUrl: event.mapUrl,
      dressCode: event.dressCode,
      heroCopy: event.heroCopy,
      isActive: event.isActive,
    });
    inserted++;
    console.log(`✓ Seeded the Year-${event.year} '${event.title}' event.`);
  }

  if (inserted === 0) console.log("✓ Demo events are already seeded.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
