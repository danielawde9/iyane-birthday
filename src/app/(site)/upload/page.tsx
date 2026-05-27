import { Uploader } from "@/components/upload/Uploader";
import { isPinRequired } from "@/lib/upload-auth";
import { SectionTitle } from "@/components/ui/SectionTitle";

export const dynamic = "force-dynamic";

export default function UploadPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <header className="mb-8 text-center">
        <SectionTitle eyebrow="Leave your memories of the day" title="Add your photos" />
        <p className="mx-auto mt-4 max-w-xl font-display text-lg italic text-ink-soft">
          Every photograph you place becomes part of Iyane&apos;s keepsake — gathered from everyone who was there.
        </p>
      </header>
      <Uploader requirePin={isPinRequired()} />
    </div>
  );
}
