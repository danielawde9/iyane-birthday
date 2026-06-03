import { headers } from "next/headers";
import { Uploader } from "@/components/upload/Uploader";
import { isUploadGeoAllowed } from "@/lib/upload-auth";
import { PageShell } from "@/components/ui/PageShell";

export const dynamic = "force-dynamic";

export default async function UploadPage() {
  // Uploads are Lebanon-only (viewing is open everywhere). Show a warm note to
  // guests abroad instead of the uploader. The /api/upload route enforces this too.
  if (!isUploadGeoAllowed(await headers())) {
    return (
      <PageShell
        eyebrow="From wherever you are"
        title="Photo uploads are for our Lebanon guests"
        lead="Adding photos is open to friends and family celebrating with us in Lebanon 💛 — but please browse the gallery and leave a wish in the guestbook from anywhere."
      >
        <p className="mx-auto max-w-md text-center font-display text-ink-soft">
          If you were there in person and this looks wrong, ask the host — they can help.
        </p>
      </PageShell>
    );
  }

  return (
    <PageShell
      eyebrow="Leave your memories of the day"
      title="Add your photos"
      lead="Every photograph you place becomes part of Iyane's keepsake — gathered from everyone who was there."
    >
      <Uploader />
    </PageShell>
  );
}
