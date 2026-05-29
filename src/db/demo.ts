import type { EventRow, PhotoRow, GuestbookRow } from "./schema";

/**
 * Seeded content used when no database is configured, so the site is fully
 * browsable (and verifiable) before Supabase is wired up. The demo photos are
 * free-license stock photography bundled under /public/demo (STAND-IN images,
 * not real event photos). Dimensions below are the real measured pixel sizes
 * of each full JPEG — keep them in sync with scripts/fetch-demo-photos.ts.
 */

export const DEMO_EVENT: EventRow = {
  id: "demo-event-0001-0001-000000000001",
  year: 1,
  themeSlug: "big-top",
  title: "Iyane — Year One",
  eventDate: new Date("2026-07-15T16:00:00"),
  venue: "The Garden Pavilion",
  address: "Beirut, Lebanon",
  mapUrl: "https://www.google.com/maps?q=Beirut,Lebanon",
  dressCode: "Dapper attire encouraged",
  heroCopy: "A page written by the room — every photograph here was placed by a guest.",
  isActive: true,
  createdAt: new Date(),
};

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

export const DEMO_PHOTOS: PhotoRow[] = DEMO_META.map((m, i) => ({
  id: `demo-photo-${i + 1}`,
  eventId: DEMO_EVENT.id,
  storageKey: `/demo/photo-${String(i + 1).padStart(2, "0")}.jpg`,
  thumbKey: `/demo/thumb-${String(i + 1).padStart(2, "0")}.jpg`,
  width: m.w,
  height: m.h,
  uploaderName: m.by,
  caption: m.caption,
  featured: i === 0,
  status: "visible",
  createdAt: new Date(Date.now() - i * 3_600_000),
}));

export const DEMO_GUESTBOOK: GuestbookRow[] = [
  {
    id: "demo-g-1",
    eventId: DEMO_EVENT.id,
    name: "Tante Layla",
    message: "One whole year, and a room full of people who love you. Keep this page forever.",
    status: "visible",
    createdAt: new Date(Date.now() - 10_800_000),
  },
  {
    id: "demo-g-2",
    eventId: DEMO_EVENT.id,
    name: "Auntie Rose",
    message: "Mabrouk ya Iyane. May every year be as full of light as this room was tonight.",
    status: "visible",
    createdAt: new Date(Date.now() - 7_200_000),
  },
  {
    id: "demo-g-3",
    eventId: DEMO_EVENT.id,
    name: "Marcus T.",
    message: "Thank you for letting us be part of the very first chapter. It was a beautiful evening.",
    status: "visible",
    createdAt: new Date(Date.now() - 5_400_000),
  },
  {
    id: "demo-g-4",
    eventId: DEMO_EVENT.id,
    name: "Mama Iyane",
    message: "Every face here, every photograph — this is the year we will always come back to.",
    status: "visible",
    createdAt: new Date(Date.now() - 3_600_000),
  },
];
