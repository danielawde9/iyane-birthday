import { cookies } from "next/headers";
import { Uploader } from "@/components/upload/Uploader";
import { isPinRequired, UPLOAD_COOKIE } from "@/lib/upload-auth";
import { verifyUploadToken } from "@/lib/pin";
import { env } from "@/lib/env";
import { PageShell } from "@/components/ui/PageShell";

export const dynamic = "force-dynamic";

export default async function UploadPage() {
  // Only show the party-code screen when a PIN is required AND the guest
  // doesn't already hold a valid unlock cookie — otherwise they'd have to
  // re-enter the code on every page load. Mirrors the check in /api/upload.
  let needsPin = isPinRequired();
  if (needsPin) {
    const token = (await cookies()).get(UPLOAD_COOKIE)?.value;
    if (await verifyUploadToken(token, env.cookieSigningKey)) needsPin = false;
  }

  return (
    <PageShell
      eyebrow="Leave your memories of the day"
      title="Add your photos"
      lead="Every photograph you place becomes part of Iyane's keepsake — gathered from everyone who was there."
    >
      <Uploader requirePin={needsPin} />
    </PageShell>
  );
}
