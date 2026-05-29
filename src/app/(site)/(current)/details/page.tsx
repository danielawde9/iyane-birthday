import { getActiveEvent } from "@/db/queries";
import { getTheme } from "@/themes";
import { PageShell } from "@/components/ui/PageShell";
import { BowTie } from "@/components/brand/BowTie";

export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(date);
}
function formatTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(date);
}

export default async function DetailsPage() {
  const event = await getActiveEvent();
  const theme = getTheme(event?.themeSlug);
  const dateLabel = event?.eventDate ? formatDate(event.eventDate) : "To be announced";
  const timeLabel = event?.eventDate ? formatTime(event.eventDate) : null;

  return (
    <PageShell eyebrow="The particulars" title="The Details">
      <div className="grid gap-6 sm:grid-cols-3">
        <Card title="When">
          <p className="h-title text-2xl text-ink">{dateLabel}</p>
          {timeLabel && <p className="mt-1 font-display italic text-ink-soft">{timeLabel}</p>}
        </Card>
        <Card title="Where">
          <p className="h-title text-2xl text-ink">{event?.venue ?? "To be announced"}</p>
          {event?.address && <p className="mt-1 font-display italic text-ink-soft">{event.address}</p>}
          {event?.mapUrl && (
            <a
              href={event.mapUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block font-sc text-[10px] uppercase tracking-[0.26em] text-gold-deep underline-offset-4 hover:underline"
            >
              Open in Maps →
            </a>
          )}
        </Card>
        <Card title="Attire">
          <p className="h-title text-2xl text-ink">{event?.dressCode ?? theme.copy.dressCode}</p>
          <BowTie className="mx-auto mt-4 h-5 w-10 text-gold-deep" />
        </Card>
      </div>
    </PageShell>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="deco-card flex h-full flex-col items-center gap-1 p-7 text-center">
      <h3 className="eyebrow mb-3">{title}</h3>
      {children}
    </div>
  );
}
