import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyPin, signUploadToken } from "@/lib/pin";
import { env } from "@/lib/env";
import { UPLOAD_COOKIE, expectedUploadPin, isPinRequired } from "@/lib/upload-auth";

export async function POST(request: Request) {
  if (isPinRequired()) {
    const body = (await request.json().catch(() => null)) as { pin?: string } | null;
    if (!body || !verifyPin(body.pin, expectedUploadPin())) {
      return NextResponse.json(
        { error: "That party code didn't match — please double-check with the host.", code: "bad_pin" },
        { status: 401 },
      );
    }
  }

  const token = await signUploadToken(env.cookieSigningKey, env.uploadTokenTtlMs);
  const cookieStore = await cookies();
  cookieStore.set(UPLOAD_COOKIE, token, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(env.uploadTokenTtlMs / 1000),
  });

  return NextResponse.json({ ok: true });
}
