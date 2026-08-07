import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getActiveEvent, insertGuestbook, listGuestbook } from "@/db/queries";
import { getClientIp } from "@/lib/request";
import { writeLimiter } from "@/lib/ratelimit-instance";
import { sanitizeText } from "@/lib/sanitize";
import { createEditToken } from "@/lib/edit-token";

export async function GET() {
  const event = await getActiveEvent();
  if (!event) return NextResponse.json({ entries: [] });
  const rows = await listGuestbook(event.id);
  return NextResponse.json({
    entries: rows.map((g) => ({ id: g.id, name: g.name, message: g.message, createdAt: g.createdAt.toISOString() })),
  });
}

export async function POST(request: Request) {
  const h = await headers();
  if (!writeLimiter.check(getClientIp(h)).allowed) {
    return NextResponse.json({ error: "Too many messages — please wait a moment." }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const name = sanitizeText(body?.name, 80);
  const message = sanitizeText(body?.message, 400);
  if (!name) return NextResponse.json({ error: "Please add your name." }, { status: 400 });
  if (!message) return NextResponse.json({ error: "Please write a little message." }, { status: 400 });

  const event = await getActiveEvent();
  if (!event) return NextResponse.json({ error: "There's no active celebration yet." }, { status: 400 });

  // The capability token that lets this guest edit or remove their own wish.
  // Only the hash is stored; the raw token is returned exactly once, here, and
  // is never logged or placed in a URL. See src/lib/edit-token.ts.
  const { token, hash } = createEditToken();

  const entry = await insertGuestbook({ eventId: event.id, name, message, editTokenHash: hash });
  return NextResponse.json({
    ok: true,
    entry: { id: entry.id, name: entry.name, message: entry.message, createdAt: entry.createdAt.toISOString() },
    editToken: token,
  });
}
