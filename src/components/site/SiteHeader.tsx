import Link from "next/link";
import { Crest } from "@/components/brand/Crest";
import { ButtonLink } from "@/components/ui/Button";

const navLink =
  "font-sc text-[11px] uppercase tracking-[0.26em] text-ink transition-colors hover:text-gold-deep";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[color:var(--c-rule)] bg-bg/92 backdrop-blur">
      <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between gap-4 px-5">
        <Link href="/" className="flex items-center gap-3" aria-label="Iyane — home">
          <Crest className="h-9 w-9" />
          <span className="script text-3xl leading-none text-ink">Iyane</span>
        </Link>

        <nav className="flex items-center gap-4 sm:gap-7">
          <Link href="/gallery" className={navLink}>Gallery</Link>
          <Link href="/guestbook" className={navLink}>Guestbook</Link>
          <Link href="/details" className={`hidden sm:inline-block ${navLink}`}>Details</Link>
          <ButtonLink href="/upload" variant="gold" className="px-4 py-2.5 sm:px-5">
            Add Photos
          </ButtonLink>
        </nav>
      </div>
    </header>
  );
}
