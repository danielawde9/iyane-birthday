import type { PostgrestError } from "@supabase/supabase-js";
import { publicData, privilegedData } from "@/lib/supabase/data";
import { mapEvent, mapPhoto, mapGuestbook, toEventColumns } from "./mappers";
import { PHOTO_COLS, GUESTBOOK_COLS } from "./columns";
import type { EditableRow } from "@/lib/edit-authz";
import type { EventRow, NewEventRow, PhotoRow, GuestbookRow } from "./schema";

/**
 * Data access for the whole app, over the Supabase HTTP API (PostgREST).
 *
 *  - Public reads use the anon client (`publicData`) and are therefore
 *    RLS-enforced (see supabase/policies.sql).
 *  - Privileged reads (admin / hidden rows) and all writes use the service-role
 *    client (`privilegedData`), which bypasses RLS.
 *
 * supabase-js never throws — it returns `{ data, error }`. Every function here
 * throws on `error` to preserve the throwing contract callers rely on (e.g.
 * /api/health and getActiveTheme treat a throw as "DB down").
 */

function check(error: PostgrestError | null, action: string): void {
  if (error) throw new Error(`db.${action}: ${error.message}`);
}

/** visible = live · hidden = the host took it down · removed = the guest did. */
export type RowStatus = "visible" | "hidden" | "removed";

// ---- Events -------------------------------------------------------------

export async function getActiveEvent(): Promise<EventRow | null> {
  const { data, error } = await publicData().from("events").select("*").eq("is_active", true).limit(1);
  check(error, "getActiveEvent");
  return data && data[0] ? mapEvent(data[0]) : null;
}

export async function listEvents(): Promise<EventRow[]> {
  const { data, error } = await publicData().from("events").select("*").order("year", { ascending: false });
  check(error, "listEvents");
  return (data ?? []).map(mapEvent);
}

export async function getEventById(id: string): Promise<EventRow | null> {
  const { data, error } = await publicData().from("events").select("*").eq("id", id).limit(1);
  check(error, "getEventById");
  return data && data[0] ? mapEvent(data[0]) : null;
}

export async function createEvent(values: NewEventRow): Promise<EventRow> {
  const { data, error } = await privilegedData().from("events").insert(toEventColumns(values)).select().single();
  check(error, "createEvent");
  return mapEvent(data!);
}

export async function updateEvent(id: string, values: Partial<NewEventRow>): Promise<void> {
  const patch = toEventColumns(values);
  if (Object.keys(patch).length === 0) return;
  const { error } = await privilegedData().from("events").update(patch).eq("id", id);
  check(error, "updateEvent");
}

/** Make exactly one event active. */
export async function setActiveEvent(id: string): Promise<void> {
  const svc = privilegedData();
  const cleared = await svc.from("events").update({ is_active: false }).eq("is_active", true);
  check(cleared.error, "setActiveEvent(clear)");
  const set = await svc.from("events").update({ is_active: true }).eq("id", id);
  check(set.error, "setActiveEvent(set)");
}

// ---- Photos -------------------------------------------------------------

export async function listVisiblePhotos(
  eventId: string,
  opts: { limit?: number; offset?: number; uploader?: string } = {},
): Promise<PhotoRow[]> {
  const limit = opts.limit ?? 60;
  const offset = opts.offset ?? 0;
  const { uploader } = opts;
  let q = publicData().from("photos").select(PHOTO_COLS).eq("event_id", eventId).eq("status", "visible");
  if (uploader !== undefined) {
    q = uploader === "__anon__" ? q.is("uploader_name", null) : q.eq("uploader_name", uploader);
  }
  const { data, error } = await q.order("created_at", { ascending: false }).range(offset, offset + limit - 1);
  check(error, "listVisiblePhotos");
  return (data ?? []).map(mapPhoto);
}

export interface ContributorRow {
  name: string | null;
  count: number;
  coverKey: string;
}

/** Distinct uploaders for an event with their photo count + latest photo as cover. */
export async function listContributors(eventId: string): Promise<ContributorRow[]> {
  const { data, error } = await publicData()
    .from("photos")
    .select("uploader_name, thumb_key, created_at")
    .eq("event_id", eventId)
    .eq("status", "visible")
    .order("created_at", { ascending: false });
  check(error, "listContributors");

  const map = new Map<string, { count: number; coverKey: string }>();
  for (const r of data ?? []) {
    const name = (r.uploader_name as string | null) ?? null;
    const key = name ?? " ";
    const cur = map.get(key);
    if (cur) cur.count++;
    else map.set(key, { count: 1, coverKey: r.thumb_key as string }); // first seen (latest) = cover
  }
  return [...map.entries()]
    .map(([key, v]) => ({ name: key === " " ? null : key, count: v.count, coverKey: v.coverKey }))
    .sort((a, b) => b.count - a.count);
}

/** The host's spotlighted photo, falling back to the most recent. */
export async function getFeaturedPhoto(eventId: string): Promise<PhotoRow | null> {
  const pub = publicData();
  const featured = await pub
    .from("photos")
    .select(PHOTO_COLS)
    .eq("event_id", eventId)
    .eq("status", "visible")
    .eq("featured", true)
    .limit(1);
  check(featured.error, "getFeaturedPhoto(featured)");
  if (featured.data && featured.data[0]) return mapPhoto(featured.data[0]);

  const latest = await pub
    .from("photos")
    .select(PHOTO_COLS)
    .eq("event_id", eventId)
    .eq("status", "visible")
    .order("created_at", { ascending: false })
    .limit(1);
  check(latest.error, "getFeaturedPhoto(latest)");
  return latest.data && latest.data[0] ? mapPhoto(latest.data[0]) : null;
}

/** Mark one photo as the event's featured spotlight (clears any previous one). */
export async function setFeatured(eventId: string, photoId: string): Promise<void> {
  const svc = privilegedData();
  const cleared = await svc.from("photos").update({ featured: false }).eq("event_id", eventId);
  check(cleared.error, "setFeatured(clear)");
  const set = await svc.from("photos").update({ featured: true }).eq("id", photoId);
  check(set.error, "setFeatured(set)");
}

export async function listAllPhotos(eventId: string): Promise<PhotoRow[]> {
  const { data, error } = await privilegedData()
    .from("photos")
    .select(PHOTO_COLS)
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  check(error, "listAllPhotos");
  return (data ?? []).map(mapPhoto);
}

export async function countVisiblePhotos(eventId: string): Promise<number> {
  const { count, error } = await publicData()
    .from("photos")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId)
    .eq("status", "visible");
  check(error, "countVisiblePhotos");
  return count ?? 0;
}

export interface NewPhotoInput {
  eventId: string;
  storageKey: string;
  thumbKey: string;
  width: number;
  height: number;
  uploaderName?: string | null;
  caption?: string | null;
  /** sha256 of the uploader's capability token — see src/lib/edit-token.ts. */
  editTokenHash: string;
}

export async function insertPhoto(input: NewPhotoInput): Promise<PhotoRow> {
  const payload = {
    event_id: input.eventId,
    storage_key: input.storageKey,
    thumb_key: input.thumbKey,
    width: input.width,
    height: input.height,
    uploader_name: input.uploaderName ?? null,
    caption: input.caption ?? null,
    edit_token_hash: input.editTokenHash,
  };
  const { data, error } = await privilegedData().from("photos").insert(payload).select(PHOTO_COLS).single();
  check(error, "insertPhoto");
  return mapPhoto(data!);
}

export async function setPhotoStatus(id: string, status: RowStatus): Promise<void> {
  const { error } = await privilegedData().from("photos").update({ status }).eq("id", id);
  check(error, "setPhotoStatus");
}

/**
 * The authorization lookup for a guest edit. This is the ONLY read in the app
 * that touches `edit_token_hash`, and it returns its own narrow shape rather
 * than a PhotoRow so the hash cannot travel any further.
 */
export async function getPhotoAuthRow(id: string): Promise<EditableRow | null> {
  const { data, error } = await privilegedData()
    .from("photos")
    .select("status,edit_token_hash")
    .eq("id", id)
    .maybeSingle();
  check(error, "getPhotoAuthRow");
  return data ? { status: data.status as string, editTokenHash: (data.edit_token_hash as string | null) ?? null } : null;
}

/**
 * Apply a guest's text edit. `columns` comes pre-built from
 * `parsePhotoEdit` (src/lib/edit-payload.ts) and can only ever contain
 * caption / uploader_name; status, featured and the token hash are unreachable.
 */
export async function updatePhotoContent(
  id: string,
  columns: Record<string, unknown>,
  editedAt: Date,
): Promise<PhotoRow | null> {
  const { data, error } = await privilegedData()
    .from("photos")
    .update({ ...columns, edited_at: editedAt.toISOString() })
    .eq("id", id)
    .select(PHOTO_COLS)
    .maybeSingle();
  check(error, "updatePhotoContent");
  return data ? mapPhoto(data) : null;
}

/** Guest-initiated soft removal. The row and both storage objects stay put. */
export async function softRemovePhoto(id: string, editedAt: Date): Promise<void> {
  const { error } = await privilegedData()
    .from("photos")
    .update({ status: "removed", edited_at: editedAt.toISOString() })
    .eq("id", id);
  check(error, "softRemovePhoto");
}

export async function deletePhoto(id: string): Promise<PhotoRow | null> {
  const { data, error } = await privilegedData().from("photos").delete().eq("id", id).select(PHOTO_COLS).maybeSingle();
  check(error, "deletePhoto");
  return data ? mapPhoto(data) : null;
}

// ---- Guestbook ----------------------------------------------------------

export async function insertGuestbook(values: {
  eventId: string;
  name: string;
  message: string;
  editTokenHash: string;
}): Promise<GuestbookRow> {
  const payload = {
    event_id: values.eventId,
    name: values.name,
    message: values.message,
    edit_token_hash: values.editTokenHash,
  };
  const { data, error } = await privilegedData().from("guestbook").insert(payload).select(GUESTBOOK_COLS).single();
  check(error, "insertGuestbook");
  return mapGuestbook(data!);
}

export async function listGuestbook(eventId: string, includeHidden = false): Promise<GuestbookRow[]> {
  // includeHidden must use the service-role client: with RLS enforced, the anon
  // client cannot see hidden rows even without a status filter.
  const client = includeHidden ? privilegedData() : publicData();
  let q = client.from("guestbook").select(GUESTBOOK_COLS).eq("event_id", eventId);
  if (!includeHidden) q = q.eq("status", "visible");
  const { data, error } = await q.order("created_at", { ascending: false });
  check(error, "listGuestbook");
  return (data ?? []).map(mapGuestbook);
}

export async function setGuestbookStatus(id: string, status: RowStatus): Promise<void> {
  const { error } = await privilegedData().from("guestbook").update({ status }).eq("id", id);
  check(error, "setGuestbookStatus");
}

/** See getPhotoAuthRow — the only guestbook read that touches the token hash. */
export async function getGuestbookAuthRow(id: string): Promise<EditableRow | null> {
  const { data, error } = await privilegedData()
    .from("guestbook")
    .select("status,edit_token_hash")
    .eq("id", id)
    .maybeSingle();
  check(error, "getGuestbookAuthRow");
  return data ? { status: data.status as string, editTokenHash: (data.edit_token_hash as string | null) ?? null } : null;
}

export async function updateGuestbookContent(
  id: string,
  columns: Record<string, unknown>,
  editedAt: Date,
): Promise<GuestbookRow | null> {
  const { data, error } = await privilegedData()
    .from("guestbook")
    .update({ ...columns, edited_at: editedAt.toISOString() })
    .eq("id", id)
    .select(GUESTBOOK_COLS)
    .maybeSingle();
  check(error, "updateGuestbookContent");
  return data ? mapGuestbook(data) : null;
}

/** Guest-initiated soft removal. Nothing is deleted. */
export async function softRemoveGuestbook(id: string, editedAt: Date): Promise<void> {
  const { error } = await privilegedData()
    .from("guestbook")
    .update({ status: "removed", edited_at: editedAt.toISOString() })
    .eq("id", id);
  check(error, "softRemoveGuestbook");
}
