import { Uploader } from "@/components/upload/Uploader";
import { isPinRequired } from "@/lib/upload-auth";
import { PageShell } from "@/components/ui/PageShell";

export const dynamic = "force-dynamic";

export default function UploadPage() {
  return (
    <PageShell
      eyebrow="Leave your memories of the day"
      title="Add your photos"
      lead="Every photograph you place becomes part of Iyane's keepsake — gathered from everyone who was there."
    >
      <Uploader requirePin={isPinRequired()} />
    </PageShell>
  );
}
