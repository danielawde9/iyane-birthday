import Link from "next/link";
import { listEvents, countVisiblePhotos } from "@/db/queries";
import { getTheme } from "@/themes";
import { SectionTitle } from "@/components/ui/SectionTitle";

export const dynamic = "force-dynamic";

export default async function ArchivePage() {
  const events = await listEvents();
  const cards = await Promise.all(
    events.map(async (event) => ({ event, count: await countVisiblePhotos(event.id), theme: getTheme(event.themeSlug) })),
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <header className="mb-10 text-center">
        <SectionTitle eyebrow="Every year, kept" title="Through the Years" />
        <p className="mx-auto mt-4 max-w-xl font-display text-lg italic text-ink-soft">
          Every birthday, kept. A new dressing each year — the same growing keepsake.
        </p>
      </header>

      <div className="space-y-4">
        {cards.map(({ event, count, theme }) => (
          <Link
            key={event.id}
            href={`/archive/${event.year}`}
            className="deco-card flex items-center justify-between gap-4 p-7 transition hover:border-accent"
          >
            <div>
              <div className="flex items-center gap-3">
                <span className="h-title text-2xl text-ink">Year {event.year}</span>
                {event.isActive && (
                  <span className="border border-accent/50 px-2 py-0.5 font-sc text-[9px] uppercase tracking-[0.22em] text-gold-deep">
                    Current
                  </span>
                )}
              </div>
              <p className="mt-1 font-display italic text-ink-soft">
                {theme.emoji} {theme.name} · {event.title}
              </p>
            </div>
            <div className="text-right">
              <div className="h-title text-3xl text-accent">{count}</div>
              <div className="font-sc text-[10px] uppercase tracking-[0.22em] text-muted">photos</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
