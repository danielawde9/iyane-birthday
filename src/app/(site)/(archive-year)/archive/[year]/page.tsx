import Link from "next/link";
import { notFound } from "next/navigation";
import { listEvents, listVisiblePhotos, countVisiblePhotos, listContributors } from "@/db/queries";
import { toPhotoDTO } from "@/lib/photo";
import { toPublicUrl } from "@/lib/storage";
import { getArchiveYearThemeShell } from "@/lib/year-theme-shell";
import { Gallery } from "@/components/gallery/Gallery";
import { PageShell } from "@/components/ui/PageShell";

export const dynamic = "force-dynamic";

const INITIAL_LIMIT = 40;

export default async function ArchiveYearPage({ params }: { params: Promise<{ year: string }> }) {
  const { year } = await params;
  const shell = getArchiveYearThemeShell(await listEvents(), year);
  if (!shell) notFound();

  const { event, theme } = shell;

  // No featured-photo query here any more: the archive page renders the wall
  // only, and the featured hero it used to sit above is gone.
  const [rows, total, contributorsRaw] = await Promise.all([
    listVisiblePhotos(event.id, { limit: INITIAL_LIMIT + 1 }),
    countVisiblePhotos(event.id),
    listContributors(event.id),
  ]);

  const hasMore = rows.length > INITIAL_LIMIT;
  const initial = rows.slice(0, INITIAL_LIMIT).map(toPhotoDTO);
  const contributors = contributorsRaw.map((c) => ({ name: c.name, count: c.count, coverUrl: toPublicUrl(c.coverKey) }));

  return (
    <PageShell
      full
      eyebrow={shell.chrome.yearLabel}
      title={event.title}
      lead={`${theme.emoji} ${theme.name}`}
      headerExtra={
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
          <Link
            href="/archive"
            className="underline-offset-4 hover:underline"
          >
            All years
          </Link>
          <Link href="/" className="underline-offset-4 hover:underline">
            Current year
          </Link>
        </div>
      }
    >
      <Gallery
        contributors={contributors}
        initial={initial}
        nextOffset={hasMore ? INITIAL_LIMIT : null}
        totalPhotos={total}
        year={event.year}
      />
    </PageShell>
  );
}
