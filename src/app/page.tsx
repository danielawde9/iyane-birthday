import { getActiveEvent, listVisiblePhotos, getFeaturedPhoto, listContributors } from "@/db/queries";
import { toPhotoDTO } from "@/lib/photo";
import { LivingGallery } from "@/components/home/LivingGallery";

export const dynamic = "force-dynamic";

const YEAR_WORDS = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];
function yearLabel(year?: number): string {
  if (!year) return "Year One";
  return `Year ${YEAR_WORDS[year] ?? year}`;
}

export default async function Home() {
  const event = await getActiveEvent();
  if (!event) {
    return <LivingGallery photos={[]} guestCount={0} yearLabel="Year One" />;
  }

  const [rows, featuredRow, contributors] = await Promise.all([
    listVisiblePhotos(event.id, { limit: 60 }),
    getFeaturedPhoto(event.id),
    listContributors(event.id),
  ]);

  // Lead the rotation with the featured photo, then the rest.
  let photos = rows.map(toPhotoDTO);
  if (featuredRow) {
    const featured = toPhotoDTO(featuredRow);
    photos = [featured, ...photos.filter((p) => p.id !== featured.id)];
  }

  return <LivingGallery photos={photos} guestCount={contributors.length} yearLabel={yearLabel(event.year)} />;
}
