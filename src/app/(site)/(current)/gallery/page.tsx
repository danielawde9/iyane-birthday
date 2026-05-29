import { getActiveEvent, listVisiblePhotos, countVisiblePhotos, getFeaturedPhoto, listContributors } from "@/db/queries";
import { toPhotoDTO } from "@/lib/photo";
import { toPublicUrl } from "@/lib/storage";
import { Gallery } from "@/components/gallery/Gallery";
import { PageShell } from "@/components/ui/PageShell";

export const dynamic = "force-dynamic";

const INITIAL_LIMIT = 40;

export default async function GalleryPage() {
  const event = await getActiveEvent();

  if (!event) {
    return (
      <PageShell
        eyebrow="The photo wall"
        title="Iyane's Year"
        lead="The wall opens once the celebration is set up."
      />
    );
  }

  const [rows, total, featuredRow, contributorsRaw] = await Promise.all([
    listVisiblePhotos(event.id, { limit: INITIAL_LIMIT + 1 }),
    countVisiblePhotos(event.id),
    getFeaturedPhoto(event.id),
    listContributors(event.id),
  ]);

  const hasMore = rows.length > INITIAL_LIMIT;
  const initial = rows.slice(0, INITIAL_LIMIT).map(toPhotoDTO);
  const featured = featuredRow ? toPhotoDTO(featuredRow) : null;
  const contributors = contributorsRaw.map((c) => ({ name: c.name, count: c.count, coverUrl: toPublicUrl(c.coverKey) }));

  return (
    <PageShell
      wide
      eyebrow="The photo wall · a shared keepsake"
      title="Iyane's Year"
      lead="A page written by the room — every photograph here came from a guest."
    >
      <Gallery
        featured={featured}
        contributors={contributors}
        initial={initial}
        nextOffset={hasMore ? INITIAL_LIMIT : null}
        totalPhotos={total}
      />
    </PageShell>
  );
}
