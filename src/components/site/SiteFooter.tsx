import Link from "next/link";
import { TextLogo } from "@/components/brand/TextLogo";
import type { SiteChrome } from "@/lib/year-theme-shell";

const footLink =
  "font-mono text-xs font-bold uppercase tracking-[0.2em] text-on-dark hover:text-accent transition-colors";

export function SiteFooter({ chrome }: { chrome?: SiteChrome }) {
  const yearLabel = chrome ? `${chrome.yearLabel} · ${chrome.themeLabel}` : "Year One · MMXXVI";
  const isArchiveMode = chrome?.mode === "archive";
  const links =
    isArchiveMode && chrome
      ? [
          { href: chrome.homeHref, label: `Year ${chrome.year}` },
          { href: "/archive", label: "All Years" },
          { href: "/", label: "Current Year" },
        ]
      : [
          { href: "/", label: "Home" },
          { href: "/gallery", label: "Gallery" },
          { href: "/guestbook", label: "Wishes" },
          { href: "/details", label: "Details" },
          { href: "/upload", label: "Add Photos" },
          { href: "/poster", label: "Poster" },
          { href: "/archive", label: "Archive" },
        ];

  return (
    <footer className="mt-0 bg-primary text-on-dark">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 pt-14 pb-12 text-center">
        <TextLogo className="text-3xl sm:text-4xl" />
        <nav className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={footLink}>
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.28em] text-on-dark/85">
          <span className="text-accent">★</span> Iyane · {yearLabel} <span className="text-accent">★</span>
        </p>
      </div>
    </footer>
  );
}
