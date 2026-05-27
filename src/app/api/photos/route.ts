import { NextResponse } from "next/server";
import { getActiveEvent, listEvents, listVisiblePhotos } from "@/db/queries";
import { toPhotoDTO } from "@/lib/photo";
import { clampInt } from "@/lib/sanitize";

/**
 * Paginated photo feed. Defaults to the active event; pass `year` to target a
 * past edition (for the archive), and `uploader` to filter to one contributor
 * (`__anon__` for nameless uploads).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = clampInt(searchParams.get("limit"), 1, 100, 40);
  const offset = clampInt(searchParams.get("offset"), 0, 1_000_000, 0);
  const uploaderParam = searchParams.get("uploader");
  const yearParam = searchParams.get("year");

  const event = yearParam
    ? (await listEvents()).find((e) => String(e.year) === yearParam) ?? null
    : await getActiveEvent();
  if (!event) return NextResponse.json({ photos: [], nextOffset: null });

  const rows = await listVisiblePhotos(event.id, {
    limit: limit + 1,
    offset,
    uploader: uploaderParam ?? undefined,
  });
  const hasMore = rows.length > limit;
  const photos = rows.slice(0, limit).map(toPhotoDTO);

  return NextResponse.json({ photos, nextOffset: hasMore ? offset + limit : null });
}
