import { describe, it, expect } from "vitest";
import { mapEvent, mapPhoto, mapGuestbook, toEventColumns } from "./mappers";

describe("mapEvent", () => {
  const raw = {
    id: "e1",
    year: 30,
    theme_slug: "big-top",
    title: "Iyane turns 30",
    event_date: "2026-07-15T16:00:00+00:00",
    venue: "The Tent",
    address: "1 Cirque Rd",
    map_url: "https://maps.example/x",
    dress_code: "Carnival chic",
    hero_copy: "Step right up",
    is_active: true,
    created_at: "2026-06-01T09:30:00+00:00",
  };

  it("renames every snake_case column to camelCase", () => {
    const e = mapEvent(raw);
    expect(e).toMatchObject({
      id: "e1",
      year: 30,
      themeSlug: "big-top",
      title: "Iyane turns 30",
      venue: "The Tent",
      address: "1 Cirque Rd",
      mapUrl: "https://maps.example/x",
      dressCode: "Carnival chic",
      heroCopy: "Step right up",
      isActive: true,
    });
  });

  it("parses timestamps into Date objects that round-trip", () => {
    const e = mapEvent(raw);
    expect(e.eventDate).toBeInstanceOf(Date);
    expect(e.createdAt).toBeInstanceOf(Date);
    // The hard-fail consumer path: Intl.format / toISOString require real Dates.
    expect(e.eventDate!.toISOString()).toBe("2026-07-15T16:00:00.000Z");
    expect(Number.isNaN(e.createdAt.getTime())).toBe(false);
  });

  it("keeps a null event_date as null (not Invalid Date)", () => {
    const e = mapEvent({ ...raw, event_date: null });
    expect(e.eventDate).toBeNull();
  });

  it("maps missing/null optional text columns to null", () => {
    const e = mapEvent({ ...raw, venue: null, address: undefined, map_url: null });
    expect(e.venue).toBeNull();
    expect(e.address).toBeNull();
    expect(e.mapUrl).toBeNull();
  });
});

describe("mapPhoto", () => {
  const raw = {
    id: "p1",
    event_id: "e1",
    storage_key: "2026/a.jpg",
    thumb_key: "2026/a_thumb.jpg",
    width: 1200,
    height: 800,
    uploader_name: "Sam",
    caption: "best night",
    featured: false,
    status: "visible",
    created_at: "2026-06-02T10:00:00+00:00",
  };

  it("renames columns and preserves enum + numeric types", () => {
    const p = mapPhoto(raw);
    expect(p).toMatchObject({
      id: "p1",
      eventId: "e1",
      storageKey: "2026/a.jpg",
      thumbKey: "2026/a_thumb.jpg",
      width: 1200,
      height: 800,
      uploaderName: "Sam",
      caption: "best night",
      featured: false,
      status: "visible",
    });
  });

  it("parses created_at into a Date", () => {
    expect(mapPhoto(raw).createdAt).toBeInstanceOf(Date);
  });

  it("maps a null uploader_name (anonymous upload) to null", () => {
    expect(mapPhoto({ ...raw, uploader_name: null }).uploaderName).toBeNull();
  });

  it("parses edited_at into a Date, and leaves a never-edited photo null", () => {
    expect(mapPhoto({ ...raw, edited_at: "2026-06-04T12:00:00+00:00" }).editedAt?.toISOString()).toBe(
      "2026-06-04T12:00:00.000Z",
    );
    expect(mapPhoto(raw).editedAt).toBeNull();
  });

  // edit_token_hash is a bearer secret. It must never ride along on a mapped row,
  // because mapped rows feed DTOs and the admin page.
  it("never carries the capability-token hash, even when the column is present", () => {
    const p = mapPhoto({ ...raw, edit_token_hash: "deadbeef" });
    expect(Object.values(p)).not.toContain("deadbeef");
    expect("editTokenHash" in p).toBe(false);
  });
});

describe("mapGuestbook", () => {
  const raw = {
    id: "g1",
    event_id: "e1",
    name: "Lou",
    message: "happy birthday!",
    status: "hidden",
    created_at: "2026-06-03T11:00:00+00:00",
  };

  it("renames columns and parses created_at into a Date", () => {
    const g = mapGuestbook(raw);
    expect(g).toMatchObject({ id: "g1", eventId: "e1", name: "Lou", message: "happy birthday!", status: "hidden" });
    expect(g.createdAt).toBeInstanceOf(Date);
    expect(g.createdAt.toISOString()).toBe("2026-06-03T11:00:00.000Z");
  });

  it("parses edited_at and leaves a never-edited wish null", () => {
    expect(mapGuestbook({ ...raw, edited_at: "2026-06-05T08:00:00+00:00" }).editedAt).toBeInstanceOf(Date);
    expect(mapGuestbook(raw).editedAt).toBeNull();
  });

  it("never carries the capability-token hash", () => {
    const g = mapGuestbook({ ...raw, edit_token_hash: "deadbeef" });
    expect(Object.values(g)).not.toContain("deadbeef");
    expect("editTokenHash" in g).toBe(false);
  });
});

describe("toEventColumns", () => {
  it("re-keys camelCase fields to snake_case columns", () => {
    expect(toEventColumns({ year: 31, themeSlug: "tiny-astronaut", title: "T", isActive: true })).toEqual({
      year: 31,
      theme_slug: "tiny-astronaut",
      title: "T",
      is_active: true,
    });
  });

  it("drops undefined keys (a Partial patch only touches provided columns)", () => {
    const patch = toEventColumns({ title: "New title", venue: undefined });
    expect(patch).toEqual({ title: "New title" });
    expect("venue" in patch).toBe(false);
  });

  it("keeps an explicit null (clearing a column like event_date)", () => {
    const patch = toEventColumns({ eventDate: null });
    expect(patch).toEqual({ event_date: null });
  });

  it("never emits server-managed columns (id, created_at)", () => {
    const patch = toEventColumns({ year: 1, title: "x" } as never);
    expect("id" in patch).toBe(false);
    expect("created_at" in patch).toBe(false);
  });
});
