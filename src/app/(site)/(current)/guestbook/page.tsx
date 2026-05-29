import { getActiveEvent, listGuestbook } from "@/db/queries";
import { GuestbookWall } from "@/components/guestbook/GuestbookWall";
import { PageShell } from "@/components/ui/PageShell";

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
    <PageShell
      eyebrow="The way a guestbook gathers names"
      title="The Guestbook"
      lead="Leave a few words for Iyane to find one day."
    >
      <GuestbookWall initial={entries} />
    </PageShell>
  );
}
