import Link from "next/link";
import { notFound } from "next/navigation";
import { listEvents, listVisiblePhotos, countVisiblePhotos, getFeaturedPhoto, listContributors } from "@/db/queries";
import { toPhotoDTO } from "@/lib/photo";
import { toPublicUrl } from "@/lib/storage";
import { getTheme } from "@/themes";
import { Gallery } from "@/components/gallery/Gallery";

export const dynamic = "force-dynamic";

const INITIAL_LIMIT = 40;

export default async function ArchiveYearPage({ params }: { params: Promise<{ year: string }> }) {
  const { year } = await params;
  const events = await listEvents();
  const event = events.find((e) => String(e.year) === year);
  if (!event) notFound();

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
  const theme = getTheme(event.themeSlug);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <header className="mb-10 text-center">
        <p className="eyebrow">Year {event.year}</p>
        <h1 className="h-title text-engrave mt-2 text-4xl text-ink sm:text-5xl">{event.title}</h1>
        <p className="mt-2 font-display italic text-ink-soft">{theme.emoji} {theme.name}</p>
        <hr className="rule-gold mx-auto mt-5 w-44" />
        <Link
          href="/archive"
          className="mt-5 inline-block font-sc text-[10px] uppercase tracking-[0.26em] text-gold-deep underline-offset-4 hover:underline"
        >
          ← All years
        </Link>
      </header>

      <Gallery
        featured={featured}
        contributors={contributors}
        initial={initial}
        nextOffset={hasMore ? INITIAL_LIMIT : null}
        totalPhotos={total}
        year={event.year}
      />
    </div>
  );
}
