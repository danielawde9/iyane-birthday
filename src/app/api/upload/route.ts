import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { verifyUploadToken } from "@/lib/pin";
import { validateUpload, extensionFor } from "@/lib/files";
import { env, isStorageConfigured } from "@/lib/env";
import { UPLOAD_COOKIE, isPinRequired } from "@/lib/upload-auth";
import { getClientIp } from "@/lib/request";
import { uploadLimiter } from "@/lib/ratelimit-instance";
import { getActiveEvent, insertPhoto } from "@/db/queries";
import { uploadToStorage } from "@/lib/storage";
import { toPhotoDTO } from "@/lib/photo";
import { sanitizeText, clampInt } from "@/lib/sanitize";

export async function POST(request: Request) {
  const h = await headers();

  // 1) Signed PIN cookie (only when a party code is configured).
  //    Lebanon-only access is enforced by Cloudflare in front of the app.
  if (isPinRequired()) {
    const cookieStore = await cookies();
    const token = cookieStore.get(UPLOAD_COOKIE)?.value;
    if (!(await verifyUploadToken(token, env.cookieSigningKey))) {
      return NextResponse.json({ error: "Please enter the party code first.", code: "locked" }, { status: 401 });
    }
  }

  // 3) Rate limit per IP.
  const limit = uploadLimiter.check(getClientIp(h));
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Just a moment — that's a lot of photos at once!", code: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)) } },
    );
  }

  // 4) Read + validate the image (magic-byte sniff, size cap).
  const form = await request.formData();
  const image = form.get("image");
  const thumb = form.get("thumb");
  if (!(image instanceof File)) {
    return NextResponse.json({ error: "No image was provided." }, { status: 400 });
  }

  const bytes = new Uint8Array(await image.arrayBuffer());
  const check = validateUpload({ size: image.size, bytes });
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 });

  const thumbBytes = thumb instanceof File ? new Uint8Array(await thumb.arrayBuffer()) : bytes;
  const thumbCheck = validateUpload({ size: thumbBytes.byteLength, bytes: thumbBytes });
  const thumbMime = thumbCheck.ok ? thumbCheck.mime : check.mime;

  const width = clampInt(form.get("width"), 1, 20000, 1200);
  const height = clampInt(form.get("height"), 1, 20000, 800);
  const uploaderName = sanitizeText(form.get("uploaderName"), 60);
  const caption = sanitizeText(form.get("caption"), 140);

  const event = await getActiveEvent();
  if (!event) return NextResponse.json({ error: "There's no active celebration yet." }, { status: 400 });

  // 5) Store the bytes (Supabase Storage, or an in-memory data URI in demo mode).
  let storageKey: string;
  let thumbKey: string;
  if (isStorageConfigured) {
    const id = crypto.randomUUID();
    storageKey = `${event.id}/${id}.${extensionFor(check.mime)}`;
    thumbKey = `${event.id}/thumb/${id}.${extensionFor(thumbMime)}`;
    await uploadToStorage(storageKey, bytes, check.mime);
    await uploadToStorage(thumbKey, thumbBytes, thumbMime);
  } else {
    storageKey = `data:${check.mime};base64,${Buffer.from(bytes).toString("base64")}`;
    thumbKey = `data:${thumbMime};base64,${Buffer.from(thumbBytes).toString("base64")}`;
  }

  const photo = await insertPhoto({
    eventId: event.id,
    storageKey,
    thumbKey,
    width,
    height,
    uploaderName,
    caption,
  });

  return NextResponse.json({ ok: true, photo: toPhotoDTO(photo) });
}
