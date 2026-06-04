import type { EventRow, NewEventRow, PhotoRow, GuestbookRow } from "./schema";

/**
 * PostgREST returns raw snake_case columns with timestamps as ISO strings.
 * The app consumes camelCase rows with `Date` timestamps (the Drizzle
 * `$inferSelect` shape). These mappers bridge the two so the rest of the app —
 * and the exported `*Row` types — stay exactly as they were under Drizzle.
 */

type Raw = Record<string, unknown>;

const asString = (v: unknown): string => v as string;
const asStringOrNull = (v: unknown): string | null => (v == null ? null : (v as string));
const asDate = (v: unknown): Date => new Date(v as string);
const asDateOrNull = (v: unknown): Date | null => (v == null ? null : new Date(v as string));

// ---- Read mappers (snake_case + ISO strings → camelCase + Date) ----------

export function mapEvent(r: Raw): EventRow {
  return {
    id: asString(r.id),
    year: r.year as number,
    themeSlug: asString(r.theme_slug),
    title: asString(r.title),
    eventDate: asDateOrNull(r.event_date),
    venue: asStringOrNull(r.venue),
    address: asStringOrNull(r.address),
    mapUrl: asStringOrNull(r.map_url),
    dressCode: asStringOrNull(r.dress_code),
    heroCopy: asStringOrNull(r.hero_copy),
    isActive: r.is_active as boolean,
    createdAt: asDate(r.created_at),
  };
}

export function mapPhoto(r: Raw): PhotoRow {
  return {
    id: asString(r.id),
    eventId: asString(r.event_id),
    storageKey: asString(r.storage_key),
    thumbKey: asString(r.thumb_key),
    width: r.width as number,
    height: r.height as number,
    uploaderName: asStringOrNull(r.uploader_name),
    caption: asStringOrNull(r.caption),
    featured: r.featured as boolean,
    status: asString(r.status), // text column → string (matches $inferSelect)
    createdAt: asDate(r.created_at),
  };
}

export function mapGuestbook(r: Raw): GuestbookRow {
  return {
    id: asString(r.id),
    eventId: asString(r.event_id),
    name: asString(r.name),
    message: asString(r.message),
    status: asString(r.status),
    createdAt: asDate(r.created_at),
  };
}

// ---- Write re-keyer (camelCase → snake_case columns) ---------------------

/** camelCase event field → PostgREST column. `id`/`createdAt` are server-managed. */
const EVENT_COLUMNS: Record<string, string> = {
  year: "year",
  themeSlug: "theme_slug",
  title: "title",
  eventDate: "event_date",
  venue: "venue",
  address: "address",
  mapUrl: "map_url",
  dressCode: "dress_code",
  heroCopy: "hero_copy",
  isActive: "is_active",
};

/**
 * Re-key a (partial) event into a snake_case PostgREST payload. Drops keys whose
 * value is `undefined` (so a `Partial` patch only touches provided columns) but
 * KEEPS explicit `null` (e.g. clearing `event_date`).
 */
export function toEventColumns(values: Partial<NewEventRow>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [field, column] of Object.entries(EVENT_COLUMNS)) {
    const v = (values as Record<string, unknown>)[field];
    if (v !== undefined) out[column] = v;
  }
  return out;
}
