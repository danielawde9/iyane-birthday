import { pgTable, uuid, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

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
  status: text("status").notNull().default("visible"), // visible | hidden
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const guestbook = pgTable("guestbook", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("visible"), // visible | hidden
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type EventRow = typeof events.$inferSelect;
export type NewEventRow = typeof events.$inferInsert;
export type PhotoRow = typeof photos.$inferSelect;
export type NewPhotoRow = typeof photos.$inferInsert;
export type GuestbookRow = typeof guestbook.$inferSelect;
