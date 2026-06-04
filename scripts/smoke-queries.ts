/**
 * Local-only smoke test for the supabase-js data layer (src/db/queries.ts).
 *
 * Exercises every query against a running LOCAL Supabase, covering the things
 * unit tests can't: real PostgREST round-trips, Date parsing on live rows, the
 * insert→read→delete cycle, and that hidden rows are visible only via the
 * service-role client. NEVER point this at production.
 *
 * Prereqs:  supabase start  &&  npm run db:push && npm run db:seed
 * Run:      npx tsx scripts/smoke-queries.ts
 */
import "../src/db/load-env"; // must run before queries.ts pulls in env.ts
import {
  getActiveEvent,
  listEvents,
  getEventById,
  listVisiblePhotos,
  listContributors,
  getFeaturedPhoto,
  listAllPhotos,
  countVisiblePhotos,
  insertPhoto,
  setPhotoStatus,
  setFeatured,
  deletePhoto,
  insertGuestbook,
  listGuestbook,
  setGuestbookStatus,
} from "../src/db/queries";

let passed = 0;
function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`ASSERT FAILED: ${msg}`);
  passed++;
  console.log(`  ✓ ${msg}`);
}
function section(name: string) {
  console.log(`\n• ${name}`);
}
const isDate = (v: unknown) => v instanceof Date && !Number.isNaN(v.getTime());

async function main() {
  section("events");
  const active = await getActiveEvent();
  assert(active, "getActiveEvent returns a seeded active event");
  assert(isDate(active!.createdAt), "event.createdAt is a Date");
  assert(active!.eventDate === null || isDate(active!.eventDate), "event.eventDate is Date|null (not a string)");
  assert(typeof active!.themeSlug === "string", "event.themeSlug mapped from theme_slug");

  const all = await listEvents();
  assert(Array.isArray(all) && all.length >= 1, "listEvents returns rows");
  assert(all.every((e) => isDate(e.createdAt)), "every listed event has a Date createdAt");

  const byId = await getEventById(active!.id);
  assert(byId?.id === active!.id, "getEventById round-trips the active event");
  assert((await getEventById("00000000-0000-0000-0000-000000000000")) === null, "getEventById returns null for missing id");

  const eventId = active!.id;

  section("photos (read)");
  const visible = await listVisiblePhotos(eventId, { limit: 5 });
  assert(Array.isArray(visible), "listVisiblePhotos returns an array");
  assert(visible.every((p) => p.status === "visible" && isDate(p.createdAt)), "visible photos are status=visible with Date createdAt");
  assert(typeof (await countVisiblePhotos(eventId)) === "number", "countVisiblePhotos returns a number");
  assert(Array.isArray(await listContributors(eventId)), "listContributors returns an array");
  const featured = await getFeaturedPhoto(eventId);
  assert(featured === null || isDate(featured.createdAt), "getFeaturedPhoto returns null or a photo with Date createdAt");

  section("photos (write round-trip)");
  const photo = await insertPhoto({
    eventId,
    storageKey: "smoke/test.jpg",
    thumbKey: "smoke/test_thumb.jpg",
    width: 100,
    height: 100,
    uploaderName: "Smoke Test",
    caption: "smoke",
  });
  assert(photo.id && isDate(photo.createdAt), "insertPhoto returns a row (with .select()) with a Date createdAt");
  assert(photo.status === "visible" && photo.featured === false, "inserted photo has DB defaults (visible, not featured)");
  assert((await listAllPhotos(eventId)).some((p) => p.id === photo.id), "listAllPhotos (privileged) includes the new photo");

  await setFeatured(eventId, photo.id);
  assert((await getFeaturedPhoto(eventId))?.id === photo.id, "setFeatured makes the photo the featured one");

  await setPhotoStatus(photo.id, "hidden");
  assert(!(await listVisiblePhotos(eventId, { limit: 100 })).some((p) => p.id === photo.id), "hidden photo drops out of public listVisiblePhotos");
  assert((await listAllPhotos(eventId)).some((p) => p.id === photo.id), "hidden photo still visible to privileged listAllPhotos");

  const deleted = await deletePhoto(photo.id);
  assert(deleted?.id === photo.id, "deletePhoto returns the deleted row (storage cleanup depends on this)");
  assert((await deletePhoto(photo.id)) === null, "deleting a missing photo returns null (maybeSingle)");

  section("guestbook (hidden-row visibility)");
  const entry = await insertGuestbook({ eventId, name: "Smoke", message: "hello from smoke test" });
  assert(entry.id && isDate(entry.createdAt), "insertGuestbook returns a row with Date createdAt");
  assert((await listGuestbook(eventId)).some((g) => g.id === entry.id), "new entry shows in public (visible) guestbook");

  await setGuestbookStatus(entry.id, "hidden");
  assert(!(await listGuestbook(eventId)).some((g) => g.id === entry.id), "hidden entry NOT in public guestbook (anon client + RLS)");
  assert((await listGuestbook(eventId, true)).some((g) => g.id === entry.id), "hidden entry IS in admin guestbook (service-role client)");
  // Leave it hidden so it doesn't pollute the public wall on a shared local db.

  console.log(`\n✅ smoke passed — ${passed} assertions`);
}

main().catch((err) => {
  console.error(`\n❌ ${err.message}`);
  console.error("   (Is local Supabase running and seeded? supabase start && npm run db:push && npm run db:seed)");
  process.exit(1);
});
