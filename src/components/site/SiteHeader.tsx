"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ButtonLink } from "@/components/ui/Button";
import { ScallopedHeader } from "@/components/brand/Marquee";
import { cn } from "@/lib/cn";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/gallery", label: "Gallery" },
  { href: "/guestbook", label: "Wishes" },
  { href: "/details", label: "Details" },
];

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 mb-6">
      <ScallopedHeader scallop="bottom">
        <div className="mx-auto flex h-[78px] max-w-6xl items-center justify-between gap-3 px-4 sm:h-[88px] sm:gap-4 sm:px-8">
          <div className="flex min-w-0 items-baseline gap-3 sm:gap-5">
            <Link
              href="/"
              aria-label="Iyane — home"
              className="shrink-0 font-display text-2xl font-bold uppercase tracking-[0.16em] text-on-dark hover:text-accent sm:text-4xl sm:tracking-[0.18em]"
            >
              IYANE
            </Link>
            <span className="hidden truncate font-body text-base italic text-on-dark/85 md:inline">
              Year One · 2026
              <span className="mx-2 text-accent">·</span>
              <Link href="/archive" className="hover:underline">Past years ▾</Link>
            </span>
          </div>

          <nav className="hidden items-center gap-5 lg:flex">
            {navItems.map((it) => {
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

          <ButtonLink href="/upload">
            <span className="hidden sm:inline">Add Photos</span>
            <span className="sm:hidden">Add</span>
          </ButtonLink>
        </div>
      </ScallopedHeader>
    </header>
  );
}
