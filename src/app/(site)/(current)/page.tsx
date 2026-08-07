import { HeroPoster } from "@/components/home/heroes/HeroPoster";

export const dynamic = "force-dynamic";

/**
 * The home page is the invitation's poster and nothing more — its job is to
 * greet and then send you on. The live slideshow that used to live here moved to
 * /gallery, where it now opens the photo wall (see D-014 in docs/decisions.md).
 *
 * It deliberately loads no photo data: the layout above it already resolves the
 * active event for the site chrome, and this route needs nothing else.
 */
export default function Home() {
  return <HeroPoster />;
}
