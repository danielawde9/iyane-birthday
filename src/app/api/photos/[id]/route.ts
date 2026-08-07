import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getPhotoAuthRow, updatePhotoContent, softRemovePhoto } from "@/db/queries";
import { EDIT_TOKEN_HEADER } from "@/lib/edit-token";
import { authorizeEdit } from "@/lib/edit-authz";
import { parsePhotoEdit } from "@/lib/edit-payload";
import { guardGuestWrite, denied, badPatch, readJson } from "@/lib/guest-write";
import { toPhotoDTO } from "@/lib/photo";

/**
 * A guest editing or removing their own photo.
 *
 * Authorization is a per-row capability token presented in the
 * `x-edit-token` header — never in the URL, which would leak it through logs,
 * referrers and browser history. Writes here use the Supabase service role,
 * which bypasses RLS, so `authorizeEdit` is the only thing protecting the row.
 */

export async function PATCH(request: Request, ctx: RouteContext<"/api/photos/[id]">) {
  const blocked = guardGuestWrite(await headers());
  if (blocked) return blocked;

  const { id } = await ctx.params;
  const token = request.headers.get(EDIT_TOKEN_HEADER);

  const authz = authorizeEdit(await getPhotoAuthRow(id), token, "patch");
  if (!authz.ok) return denied(authz.code);

  const patch = parsePhotoEdit(await readJson(request));
  if (!patch.ok) return badPatch();

  const photo = await updatePhotoContent(id, patch.columns, new Date());
  if (!photo) return denied("forbidden");
  return NextResponse.json({ ok: true, photo: toPhotoDTO(photo) });
}

export async function DELETE(request: Request, ctx: RouteContext<"/api/photos/[id]">) {
  const blocked = guardGuestWrite(await headers());
  if (blocked) return blocked;

  const { id } = await ctx.params;
  const token = request.headers.get(EDIT_TOKEN_HEADER);

  const authz = authorizeEdit(await getPhotoAuthRow(id), token, "delete");
  if (!authz.ok) return denied(authz.code);

  // Soft delete on purpose: the row stays, and so do both storage objects. A
  // guest can change their mind, and the host can put it back from /admin.
  await softRemovePhoto(id, new Date());
  return NextResponse.json({ ok: true, status: "removed" });
}
