"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
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
  const [menuOpen, setMenuOpen] = useState(false);
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
  const showCta = isArchiveMode || pathname !== "/upload";
  const yearLabel = chrome
    ? isArchiveMode
      ? chrome.yearLabel
      : `${chrome.yearLabel} · ${chrome.themeLabel}`
    : "Year One · 2026";

  return (
    <header className="sticky top-0 z-40 mb-6">
      <ScallopedHeader scallop="bottom">
        <div className="relative mx-auto flex h-[78px] max-w-6xl items-center justify-between gap-3 px-4 sm:h-[88px] sm:gap-4 sm:px-8">
          {/* The wordmark and its caption stack. Side by side they competed with
              the nav for horizontal space and the theme name got truncated
              mid-word ("The Greatest Little Show on Ear…"); stacked, the line
              has the full width of the brand block to itself. */}
          <div className="flex min-w-0 flex-col justify-center gap-0.5">
            <Link
              href={brandHref}
              aria-label="Iyane home"
              className="shrink-0 leading-none text-on-dark transition-colors hover:text-accent-bright"
            >
              <TextLogo className="text-[1.4rem] sm:text-3xl" />
            </Link>
            <span className="hidden whitespace-nowrap font-body text-xs italic leading-tight text-on-dark/85 md:inline lg:text-sm">
              {yearLabel}
              <span className="mx-1.5 text-accent-bright">·</span>
              <Link href="/archive" className="hover:underline">
                {isArchiveMode ? "All years" : "Past years ▾"}
              </Link>
              {isArchiveMode && (
                <>
                  <span className="mx-1.5 text-accent-bright">·</span>
                  <Link href="/" className="hover:underline">
                    Current year
                  </Link>
                </>
              )}
            </span>
          </div>

          <nav className="hidden items-center gap-5 lg:flex" aria-label="Main navigation">
            {activeNavItems.map((it) => {
              const active = pathname === it.href || (it.href !== "/" && pathname.startsWith(it.href));
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  className={cn(
                    "font-display text-sm uppercase tracking-[0.08em] text-on-dark transition-colors hover:text-accent-bright",
                    active && "nav-active text-accent-bright",
                  )}
                >
                  {it.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {showCta && (
              <ButtonLink href={ctaHref} className="hidden sm:inline-flex">
                {ctaWide}
              </ButtonLink>
            )}
            <button
              type="button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="site-mobile-menu"
              onClick={() => setMenuOpen((open) => !open)}
              className="flex h-11 w-11 items-center justify-center border-2 border-on-dark text-on-dark transition hover:border-accent-bright hover:text-accent-bright lg:hidden"
            >
              <span className="flex flex-col gap-1.5" aria-hidden="true">
                <span className={cn("block h-0.5 w-5 bg-current transition", menuOpen && "translate-y-2 rotate-45")} />
                <span className={cn("block h-0.5 w-5 bg-current transition", menuOpen && "opacity-0")} />
                <span className={cn("block h-0.5 w-5 bg-current transition", menuOpen && "-translate-y-2 -rotate-45")} />
              </span>
            </button>
          </div>

          {menuOpen && (
            <nav
              id="site-mobile-menu"
              aria-label="Mobile navigation"
              className="deco-card absolute inset-x-4 top-full z-50 mt-2 flex flex-col gap-1 bg-paper-deep p-4 text-ink lg:hidden"
            >
              {activeNavItems.map((it) => {
                const active = pathname === it.href || (it.href !== "/" && pathname.startsWith(it.href));
                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "px-2 py-3 font-display text-sm uppercase tracking-[0.08em] transition hover:text-primary",
                      active && "text-primary",
                    )}
                  >
                    {it.label}
                  </Link>
                );
              })}
              {showCta && (
                <ButtonLink href={ctaHref} onClick={() => setMenuOpen(false)} className="mt-2 w-full">
                  {ctaNarrow === "Add" ? "Add Photos" : ctaWide}
                </ButtonLink>
              )}
            </nav>
          )}
        </div>
      </ScallopedHeader>
    </header>
  );
}
