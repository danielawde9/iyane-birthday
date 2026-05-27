import { getActiveEvent, listGuestbook } from "@/db/queries";
import { GuestbookWall } from "@/components/guestbook/GuestbookWall";
import { SectionTitle } from "@/components/ui/SectionTitle";

export const dynamic = "force-dynamic";

export default async function GuestbookPage() {
  const event = await getActiveEvent();
  const entries = event
    ? (await listGuestbook(event.id)).map((g) => ({
        id: g.id,
        name: g.name,
        message: g.message,
        createdAt: g.createdAt.toISOString(),
      }))
    : [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <header className="mb-10 text-center">
        <SectionTitle eyebrow="The way a guestbook gathers names" title="The Guestbook" />
        <p className="mx-auto mt-4 max-w-xl font-display text-lg italic text-ink-soft">
          Leave a few words for Iyane to find one day.
        </p>
      </header>
      <GuestbookWall initial={entries} />
    </div>
  );
}
