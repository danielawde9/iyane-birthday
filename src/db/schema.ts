import { sql } from "drizzle-orm";
import { pgTable, uuid, text, integer, boolean, timestamp, check } from "drizzle-orm/pg-core";

/**
 * `status` on guest-owned rows is a three-state column:
 *   visible — on the site
 *   hidden  — the HOST took it down (a guest cannot edit or undo this)
 *   removed — the GUEST took it down (the host can restore it)
 * They stay distinct so the host can tell moderation from a guest's own change
 * of heart. The CHECK constraint is the invariant; the app never invents a
 * fourth value.
 */
const STATUS_VALUES = sql`('visible','hidden','removed')`;

/** One row per birthday year. The active row drives the homepage + theme. */
export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  year: integer("year").notNull(),
  themeSlug: text("theme_slug").notNull().default("big-top"),
  title: text("title").notNull(),
  eventDate: timestamp("event_date", { withTimezone: true }),
  venue: text("venue"),
  address: text("address"),
  mapUrl: text("map_url"),
  dressCode: text("dress_code"),
  heroCopy: text("hero_copy"),
  isActive: boolean("is_active").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Guest-uploaded photos. Persist forever; linked to a year. */
export const photos = pgTable("photos", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  storageKey: text("storage_key").notNull(),
  thumbKey: text("thumb_key").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  uploaderName: text("uploader_name"),
  caption: text("caption"),
  featured: boolean("featured").notNull().default(false), // the host's spotlighted moment
  status: text("status").notNull().default("visible"), // visible | hidden | removed
  editTokenHash: text("edit_token_hash"), // sha256 of the uploader's capability token; never leaves the server
  editedAt: timestamp("edited_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [check("photos_status_check", sql`${t.status} in ${STATUS_VALUES}`)]);

export const guestbook = pgTable("guestbook", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("visible"), // visible | hidden | removed
  editTokenHash: text("edit_token_hash"), // sha256 of the signer's capability token; never leaves the server
  editedAt: timestamp("edited_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [check("guestbook_status_check", sql`${t.status} in ${STATUS_VALUES}`)]);

export type EventRow = typeof events.$inferSelect;
export type NewEventRow = typeof events.$inferInsert;
/**
 * The app's row types deliberately EXCLUDE `editTokenHash`. It is a bearer
 * secret: the only code allowed to read it is the authorization lookup in
 * `src/db/queries.ts`, which returns its own narrow shape. Widening these back
 * to `$inferSelect` will fail to compile in `src/db/mappers.ts` — that is the
 * tripwire, not a bug.
 */
export type PhotoRow = Omit<typeof photos.$inferSelect, "editTokenHash">;
export type NewPhotoRow = typeof photos.$inferInsert;
export type GuestbookRow = Omit<typeof guestbook.$inferSelect, "editTokenHash">;
