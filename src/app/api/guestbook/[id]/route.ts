import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getGuestbookAuthRow, updateGuestbookContent, softRemoveGuestbook } from "@/db/queries";
import { EDIT_TOKEN_HEADER } from "@/lib/edit-token";
import { authorizeEdit } from "@/lib/edit-authz";
import { parseGuestbookEdit } from "@/lib/edit-payload";
import { guardGuestWrite, denied, badPatch, readJson } from "@/lib/guest-write";

/**
 * A guest editing or removing their own guestbook wish. Same capability-token
 * rules as /api/photos/[id] — see the note there.
 */

export async function PATCH(request: Request, ctx: RouteContext<"/api/guestbook/[id]">) {
  const blocked = guardGuestWrite(await headers());
  if (blocked) return blocked;

  const { id } = await ctx.params;
  const token = request.headers.get(EDIT_TOKEN_HEADER);

  const authz = authorizeEdit(await getGuestbookAuthRow(id), token, "patch");
  if (!authz.ok) return denied(authz.code);

  const patch = parseGuestbookEdit(await readJson(request));
  if (!patch.ok) return badPatch();

  const entry = await updateGuestbookContent(id, patch.columns, new Date());
  if (!entry) return denied("forbidden");
  return NextResponse.json({
    ok: true,
    entry: { id: entry.id, name: entry.name, message: entry.message, createdAt: entry.createdAt.toISOString() },
  });
}

export async function DELETE(request: Request, ctx: RouteContext<"/api/guestbook/[id]">) {
  const blocked = guardGuestWrite(await headers());
  if (blocked) return blocked;

  const { id } = await ctx.params;
  const token = request.headers.get(EDIT_TOKEN_HEADER);

  const authz = authorizeEdit(await getGuestbookAuthRow(id), token, "delete");
  if (!authz.ok) return denied(authz.code);

  // Soft delete: the wish stays in the database so the host can restore it.
  await softRemoveGuestbook(id, new Date());
  return NextResponse.json({ ok: true, status: "removed" });
}
