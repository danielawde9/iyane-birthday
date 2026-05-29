"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ButtonLink } from "@/components/ui/Button";
import { ScallopedHeader } from "@/components/brand/Marquee";
import { TextLogo } from "@/components/brand/TextLogo";
import { cn } from "@/lib/cn";
import type { SiteChrome } from "@/lib/year-theme-shell";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/gallery", label: "Gallery" },
  { href: "/guestbook", label: "Wishes" },
  { href: "/details", label: "Details" },
];

export function SiteHeader({ chrome }: { chrome?: SiteChrome }) {
  const pathname = usePathname();
  const brandHref = chrome?.homeHref ?? "/";
  const isArchiveMode = chrome?.mode === "archive";
  const activeNavItems =
    isArchiveMode && chrome
      ? [
          { href: chrome.homeHref, label: `Year ${chrome.year}` },
          { href: "/archive", label: "All Years" },
          { href: "/", label: "Current Year" },
        ]
      : navItems;
  const ctaHref = isArchiveMode ? "/archive" : "/upload";
  const ctaWide = isArchiveMode ? "All Years" : "Add Photos";
  const ctaNarrow = isArchiveMode ? "All" : "Add";
  const yearLabel = chrome
    ? isArchiveMode
      ? chrome.yearLabel
      : `${chrome.yearLabel} · ${chrome.themeLabel}`
    : "Year One · 2026";

  return (
    <header className="sticky top-0 z-40 mb-6">
      <ScallopedHeader scallop="bottom">
        <div className="mx-auto flex h-[78px] max-w-6xl items-center justify-between gap-3 px-4 sm:h-[88px] sm:gap-4 sm:px-8">
          <div className="flex min-w-0 items-baseline gap-3 sm:gap-5">
            <Link
              href={brandHref}
              aria-label="Iyane home"
              className="shrink-0 text-on-dark transition-colors hover:text-accent"
            >
              <TextLogo className="text-[1.55rem] sm:text-4xl" />
            </Link>
            <span className="hidden truncate font-body text-base italic text-on-dark/85 md:inline">
              {yearLabel}
              <span className="mx-2 text-accent">·</span>
              <Link href="/archive" className="hover:underline">
                {isArchiveMode ? "All years" : "Past years ▾"}
              </Link>
              {isArchiveMode && (
                <>
                  <span className="mx-2 text-accent">·</span>
                  <Link href="/" className="hover:underline">
                    Current year
                  </Link>
                </>
              )}
            </span>
          </div>

          <nav className="hidden items-center gap-5 lg:flex">
            {activeNavItems.map((it) => {
              const active = pathname === it.href || (it.href !== "/" && pathname.startsWith(it.href));
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  className={cn(
                    "font-display text-sm font-bold uppercase tracking-[0.08em] text-on-dark transition-colors hover:text-accent",
                    active && "nav-active text-accent",
                  )}
                >
                  {it.label}
                </Link>
              );
            })}
          </nav>

          <ButtonLink href={ctaHref}>
            <span className="hidden sm:inline">{ctaWide}</span>
            <span className="sm:hidden">{ctaNarrow}</span>
          </ButtonLink>
        </div>
      </ScallopedHeader>
    </header>
  );
}
