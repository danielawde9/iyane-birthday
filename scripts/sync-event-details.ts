import "../src/db/load-env";
import { eq } from "drizzle-orm";
import { getDb } from "../src/db";
import { events } from "../src/db/schema";
import { DEMO_EVENT } from "../src/db/demo";

/**
 * Bring an EXISTING year-1 event row in line with the invitation film.
 *
 * `db:seed` deliberately leaves an existing year-1 row alone, so that a real
 * event's details are never clobbered by a fixture. That is the right default —
 * but it also means the corrected date and venue in src/db/demo.ts only reach a
 * brand-new database. This script is the explicit way to apply them to a
 * database that already has the row.
 *
 * The invitation reads: SATURDAY 15 AUGUST AT 4:00 PM, AT TETA AND JEDDO'S
 * HOUSE, GHARIFEH. The row seeded before the invitation existed said 15 July at
 * "Gharfi, Shouf" — wrong month and wrong place.
 *
 * Run with:  npx tsx scripts/sync-event-details.ts
 * Add --dry to print the change without writing.
 *
 * It only ever touches year 1, only the four detail fields, and prints the
 * before/after so the change is reviewable. Point DATABASE_URL at production
 * deliberately if and when you want it there.
 */
const DRY = process.argv.includes("--dry");

async function main() {
  const db = getDb(); // throws if DATABASE_URL is not set

  const [existing] = await db.select().from(events).where(eq(events.year, 1));
  if (!existing) {
    console.log("No year-1 event row found — nothing to sync. Run `npm run db:seed` first.");
    process.exit(0);
  }

  const next = {
    eventDate: DEMO_EVENT.eventDate,
    venue: DEMO_EVENT.venue,
    address: DEMO_EVENT.address,
    dressCode: DEMO_EVENT.dressCode,
  };

  const before = {
    eventDate: existing.eventDate,
    venue: existing.venue,
    address: existing.address,
    dressCode: existing.dressCode,
  };

  const changed = (Object.keys(next) as (keyof typeof next)[]).filter((k) => {
    const a = before[k];
    const b = next[k];
    if (a instanceof Date && b instanceof Date) return a.getTime() !== b.getTime();
    return a !== b;
  });

  if (changed.length === 0) {
    console.log("✓ Year-1 event already matches the invitation — nothing to do.");
    process.exit(0);
  }

  for (const key of changed) {
    console.log(`  ${key}:\n    before: ${String(before[key])}\n    after:  ${String(next[key])}`);
  }

  if (DRY) {
    console.log("\n(--dry) No changes written.");
    process.exit(0);
  }

  await db.update(events).set(next).where(eq(events.year, 1));
  console.log(`\n✓ Updated ${changed.length} field(s) on the Year-1 event.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
