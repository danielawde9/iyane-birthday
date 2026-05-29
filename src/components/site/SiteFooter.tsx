import Link from "next/link";

const footLink =
  "font-mono text-xs font-bold uppercase tracking-[0.2em] text-on-dark hover:text-accent transition-colors";

export function SiteFooter() {
  return (
    <footer className="mt-20 bg-primary text-on-dark">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 pt-14 pb-12 text-center">
        <p className="font-display text-3xl font-bold uppercase tracking-[0.2em] text-on-dark sm:text-4xl">
          IYANE
        </p>
        <nav className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
          <Link href="/" className={footLink}>Home</Link>
          <Link href="/gallery" className={footLink}>Gallery</Link>
          <Link href="/upload" className={footLink}>Add Photos</Link>
          <Link href="/guestbook" className={footLink}>Guestbook</Link>
          <Link href="/poster" className={footLink}>Poster</Link>
          <Link href="/archive" className={footLink}>Archive</Link>
        </nav>
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.28em] text-on-dark/85">
          <span className="text-accent">★</span> Iyane · Year One · MMXXVI <span className="text-accent">★</span>
        </p>
      </div>
    </footer>
  );
}
