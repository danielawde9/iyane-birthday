import Link from "next/link";
import { Crest } from "@/components/brand/Crest";

const footLink = "font-sc text-[10px] uppercase tracking-[0.28em] text-on-dark/75 hover:text-accent";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-[color:var(--c-gold-rule-faint)] bg-primary text-on-dark">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-4 pt-14 pb-24 text-center sm:pb-14">
        <Crest className="h-12 w-12" />
        <p className="script text-5xl leading-none text-accent">Iyane</p>
        <hr className="rule-gold w-40" />
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <Link href="/" className={footLink}>Invitation</Link>
          <Link href="/gallery" className={footLink}>Gallery</Link>
          <Link href="/upload" className={footLink}>Add Photos</Link>
          <Link href="/guestbook" className={footLink}>Guestbook</Link>
          <Link href="/poster" className={footLink}>Poster</Link>
        </nav>
        <p className="font-sc text-[10px] uppercase tracking-[0.3em] text-on-dark/55">
          Year One · MMXXVI · Made by the room
        </p>
      </div>
    </footer>
  );
}
