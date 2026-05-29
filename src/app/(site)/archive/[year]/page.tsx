import Link from "next/link";
import { notFound } from "next/navigation";
import { listEvents, listVisiblePhotos, countVisiblePhotos, getFeaturedPhoto, listContributors } from "@/db/queries";
import { toPhotoDTO } from "@/lib/photo";
import { toPublicUrl } from "@/lib/storage";
import { getTheme, themeToCssVars } from "@/themes";
import { Gallery } from "@/components/gallery/Gallery";
import { PageShell } from "@/components/ui/PageShell";

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
  // Re-skin the archive content to this year's theme. CSS variables cascade,
  // so every component inside this wrapper picks up the past year's palette
  // (the site header/footer remain in the active year's chrome — they're
  // rendered higher in the tree by (site)/layout.tsx).
  const yearThemeVars = themeToCssVars(theme) as React.CSSProperties;

  return (
    <div className="bg-bg text-on-surface" style={yearThemeVars} data-theme={theme.slug}>
      <PageShell
        wide
        eyebrow={`Year ${event.year}`}
        title={event.title}
        lead={`${theme.emoji} ${theme.name}`}
        headerExtra={
          <Link
            href="/archive"
            className="inline-block font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-primary underline-offset-4 hover:underline"
          >
            ← All years
          </Link>
        }
      >
        <Gallery
          featured={featured}
          contributors={contributors}
          initial={initial}
          nextOffset={hasMore ? INITIAL_LIMIT : null}
          totalPhotos={total}
          year={event.year}
        />
      </PageShell>
    </div>
  );
}
