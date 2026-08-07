import type { EventRow, PhotoRow, GuestbookRow } from "./schema";

/**
 * Seed fixtures used ONLY by the `db:seed` / `db:seed-photos` scripts to bootstrap a
 * fresh database (the app itself always requires a real DB — there is no demo fallback).
 * The demo photos are free-license stock photography bundled under /public/demo (STAND-IN
 * images, not real event photos). Dimensions below are the real measured pixel sizes of
 * each full JPEG — keep them in sync with scripts/fetch-demo-photos.ts.
 */

export const DEMO_EVENT: EventRow = {
  id: "demo-event-0001-0001-000000000001",
  year: 1,
  themeSlug: "big-top",
  title: "Iyane — Year One",
  // Matches the invitation film: "SATURDAY 15 AUGUST AT 4:00 PM / AT TETA AND
  // JEDDO'S HOUSE, GHARIFEH". The previous values here (15 July, "Gharfi, Shouf")
  // predate the invitation and disagreed with what guests were actually sent.
  // NOTE: seed.ts skips year-1 rows that already exist, so changing this only
  // affects a fresh database — an existing row needs the admin page.
  eventDate: new Date("2026-08-15T16:00:00"),
  venue: "Teta & Jeddo's House",
  address: "Gharifeh, Lebanon",
  mapUrl: "https://maps.app.goo.gl/sfwNaXMNvN6kfsrV8",
  dressCode: "Sunday best · stripes encouraged",
  heroCopy: "A page written by the room — every photograph here was placed by a guest.",
  isActive: true,
  createdAt: new Date(),
};

export const LOCAL_TEST_EVENT_TWO: EventRow = {
  id: "demo-event-0002-0002-000000000002",
  year: 2,
  themeSlug: "tiny-astronaut",
  title: "Iyane - Mission Two",
  eventDate: new Date("2027-07-15T16:00:00"),
  venue: "Mission Control Pavilion",
  address: "Beirut, Lebanon",
  mapUrl: "https://www.google.com/maps?q=Beirut,Lebanon",
  dressCode: "Silver, white, and space-bright colors",
  heroCopy: "A second orbit around the sun - crew photos, wishes, and tiny launch notes.",
  isActive: false,
  createdAt: new Date(),
};

export const DEMO_EVENTS: EventRow[] = [DEMO_EVENT];
export const LOCAL_TEST_EVENTS: EventRow[] = [LOCAL_TEST_EVENT_TWO];

export function getDemoEvents({ includeLocalTestYears = false } = {}): EventRow[] {
  return includeLocalTestYears ? [...LOCAL_TEST_EVENTS, ...DEMO_EVENTS] : DEMO_EVENTS;
}

export function isLocalTestEvent(event: Pick<EventRow, "year" | "themeSlug" | "title">): boolean {
  return (
    event.year === LOCAL_TEST_EVENT_TWO.year &&
    event.themeSlug === LOCAL_TEST_EVENT_TWO.themeSlug &&
    event.title === LOCAL_TEST_EVENT_TWO.title
  );
}

const DEMO_META: { w: number; h: number; caption: string | null; by: string }[] = [
  { w: 1600, h: 1067, caption: "The first waltz", by: "Tante Layla" },
  { w: 1600, h: 1460, caption: null, by: "Maya K." },
  { w: 1600, h: 1067, caption: "By the tall windows", by: "Jordan A." },
  { w: 1600, h: 1068, caption: null, by: "Auntie Rose" },
  { w: 1600, h: 1067, caption: null, by: "Marcus T." },
  { w: 1600, h: 2400, caption: "Candlelight", by: "Priya N." },
  { w: 1600, h: 1067, caption: null, by: "Sade O." },
  { w: 1600, h: 2400, caption: null, by: "Ben H." },
  { w: 1600, h: 1159, caption: "The whole room", by: "Nikki D." },
  { w: 1600, h: 1200, caption: null, by: "Daniel O." },
  { w: 1600, h: 1068, caption: null, by: "Yara M." },
  { w: 1600, h: 1068, caption: null, by: "Tomas L." },
  { w: 1600, h: 1067, caption: "Quiet moment", by: "Aisha B." },
  { w: 1600, h: 1068, caption: null, by: "Léa P." },
  { w: 1600, h: 2135, caption: null, by: "Theo R." },
  { w: 1600, h: 1068, caption: null, by: "Mama Iyane" },
  { w: 1600, h: 2362, caption: null, by: "Oncle Pierre" },
  { w: 1600, h: 2400, caption: null, by: "Kiana W." },
  { w: 1600, h: 2133, caption: "Confetti", by: "Felix S." },
  { w: 1600, h: 1200, caption: null, by: "Amani G." },
  { w: 1600, h: 1067, caption: null, by: "Rita V." },
  { w: 1600, h: 965, caption: null, by: "Hugo M." },
  { w: 1600, h: 2400, caption: null, by: "Selma K." },
  { w: 1600, h: 1067, caption: null, by: "Camille D." },
];

function buildDemoPhotos({
  event,
  idPrefix,
  meta,
  featuredIndex = 0,
}: {
  event: EventRow;
  idPrefix: string;
  meta: typeof DEMO_META;
  featuredIndex?: number;
}): PhotoRow[] {
  return meta.map((m, i) => ({
    id: `${idPrefix}-${i + 1}`,
    eventId: event.id,
    storageKey: `/demo/photo-${String(i + 1).padStart(2, "0")}.jpg`,
    thumbKey: `/demo/thumb-${String(i + 1).padStart(2, "0")}.jpg`,
    width: m.w,
    height: m.h,
    uploaderName: m.by,
    caption: m.caption,
    featured: i === featuredIndex,
    status: "visible",
    editedAt: null,
    createdAt: new Date(Date.now() - i * 3_600_000),
  }));
}

const DEMO_YEAR_TWO_META: typeof DEMO_META = DEMO_META.slice(0, 12).map((m, i) => ({
  ...m,
  caption: i === 0 ? "Moonwalk moment" : m.caption,
}));

export const DEMO_PHOTOS: PhotoRow[] = buildDemoPhotos({
  event: DEMO_EVENT,
  idPrefix: "demo-photo",
  meta: DEMO_META,
});

export const LOCAL_TEST_PHOTOS: PhotoRow[] = buildDemoPhotos({
  event: LOCAL_TEST_EVENT_TWO,
  idPrefix: "demo-year-two-photo",
  meta: DEMO_YEAR_TWO_META,
});

export function getDemoPhotos({ includeLocalTestYears = false } = {}): PhotoRow[] {
  return includeLocalTestYears ? [...DEMO_PHOTOS, ...LOCAL_TEST_PHOTOS] : DEMO_PHOTOS;
}

export const DEMO_GUESTBOOK: GuestbookRow[] = [
  {
    id: "demo-g-1",
    eventId: DEMO_EVENT.id,
    name: "Tante Layla",
    message: "One whole year, and a room full of people who love you. Keep this page forever.",
    status: "visible",
    editedAt: null,
    createdAt: new Date(Date.now() - 10_800_000),
  },
  {
    id: "demo-g-2",
    eventId: DEMO_EVENT.id,
    name: "Auntie Rose",
    message: "Mabrouk ya Iyane. May every year be as full of light as this room was tonight.",
    status: "visible",
    editedAt: null,
    createdAt: new Date(Date.now() - 7_200_000),
  },
  {
    id: "demo-g-3",
    eventId: DEMO_EVENT.id,
    name: "Marcus T.",
    message: "Thank you for letting us be part of the very first chapter. It was a beautiful evening.",
    status: "visible",
    editedAt: null,
    createdAt: new Date(Date.now() - 5_400_000),
  },
  {
    id: "demo-g-4",
    eventId: DEMO_EVENT.id,
    name: "Mama Iyane",
    message: "Every face here, every photograph — this is the year we will always come back to.",
    status: "visible",
    editedAt: null,
    createdAt: new Date(Date.now() - 3_600_000),
  },
];
