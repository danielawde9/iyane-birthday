"use client";

import { useCallback, useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Captions from "yet-another-react-lightbox/plugins/captions";
import "yet-another-react-lightbox/plugins/captions.css";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import type { PhotoDTO } from "@/lib/photo";
import { ButtonLink } from "@/components/ui/Button";
import { StarRule } from "@/components/ui/StarRule";
import { cn } from "@/lib/cn";

export interface GalleryContributor {
  name: string | null;
  count: number;
  coverUrl: string;
}

interface GalleryProps {
  featured: PhotoDTO | null;
  contributors: GalleryContributor[];
  initial: PhotoDTO[];
  nextOffset: number | null;
  totalPhotos: number;
  year?: number; // when set, the feed targets this past edition
}

const ALL = "__all__";
const keyOf = (name: string | null) => (name == null ? "__anon__" : name);
const labelOf = (name: string | null) => name ?? "Guests";

/** Two-letter monogram for a guest, e.g. "Tante Layla" → "TL". */
function initials(name: string | null): string {
  if (!name) return "··";
  const parts = name.replace(/[^A-Za-z\s.]/g, "").split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "··";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

const lightboxStyles = {
  container: { backgroundColor: "color-mix(in srgb, var(--c-projector-deep) 97%, transparent)" },
  button: { color: "var(--c-accent-bright)", filter: "none" },
  navigationPrev: { color: "var(--c-accent-bright)" },
  navigationNext: { color: "var(--c-accent-bright)" },
  captionsTitle: {
    fontFamily: "var(--font-body)",
    fontStyle: "italic",
    fontSize: "1.3rem",
    color: "var(--c-on-dark)",
  },
  captionsDescription: {
    fontFamily: "var(--font-mono)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.14em",
    fontSize: "0.7rem",
    color: "var(--c-accent)",
  },
} as const;

function toSlides(photos: PhotoDTO[]) {
  return photos.map((p) => ({
    src: p.url,
    width: p.width,
    height: p.height,
    title: p.caption ?? undefined,
    description: p.uploaderName ? `Photo by ${p.uploaderName}` : undefined,
  }));
}

type Tab = typeof ALL | "recent" | "by-guest";

export function Gallery({ featured, contributors, initial, nextOffset, totalPhotos, year }: GalleryProps) {
  const [photos, setPhotos] = useState<PhotoDTO[]>(initial);
  const [next, setNext] = useState<number | null>(nextOffset);
  const [active, setActive] = useState<string>(ALL);
  const [tab, setTab] = useState<Tab>(ALL);
  const [loading, setLoading] = useState(false);
  const [index, setIndex] = useState(-1);
  const [featuredOpen, setFeaturedOpen] = useState(false);

  const fetchScope = useCallback(
    async (scope: string, offset: number) => {
      const params = new URLSearchParams({ limit: "40", offset: String(offset) });
      if (scope !== ALL) params.set("uploader", scope);
      if (year != null) params.set("year", String(year));
      const res = await fetch(`/api/photos?${params.toString()}`);
      return (await res.json()) as { photos: PhotoDTO[]; nextOffset: number | null };
    },
    [year],
  );

  const selectScope = useCallback(
    async (scope: string) => {
      if (scope === active || loading) return;
      setActive(scope);
      setLoading(true);
      try {
        const data = await fetchScope(scope, 0);
        setPhotos(data.photos);
        setNext(data.nextOffset);
      } finally {
        setLoading(false);
      }
    },
    [active, loading, fetchScope],
  );

  const loadMore = useCallback(async () => {
    if (next == null || loading) return;
    setLoading(true);
    try {
      const data = await fetchScope(active, next);
      setPhotos((prev) => [...prev, ...data.photos]);
      setNext(data.nextOffset);
    } finally {
      setLoading(false);
    }
  }, [next, loading, active, fetchScope]);

  const guestCount = contributors.length;
  // Don't show the featured photo twice — when its hero is visible (the "all"
  // scope), drop it from the grid + lightbox below.
  const gridPhotos = featured && active === ALL ? photos.filter((p) => p.id !== featured.id) : photos;

  return (
    <div>
      {/* Featured moment — a vintage playbill panel */}
      {featured && active === ALL && (
        <figure className="mb-10">
          <p className="eyebrow mb-3 text-center">A Moment From the Room</p>
          <button
            onClick={() => setFeaturedOpen(true)}
            className="group relative block w-full overflow-hidden border-[6px] border-accent bg-paper-deep"
            style={{ boxShadow: "0 0 0 4px var(--c-ink)" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={featured.url}
              alt={featured.caption ?? "Featured moment"}
              className="max-h-[62vh] w-full object-cover transition-transform duration-700 group-hover:scale-[1.01]"
            />
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/85 via-ink/25 to-transparent p-6 text-left sm:p-8">
              {featured.caption && (
                <p className="h-title text-2xl uppercase text-on-dark sm:text-3xl">{featured.caption}</p>
              )}
              {featured.uploaderName && (
                <p className="mt-2 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
                  — Added by {featured.uploaderName}
                </p>
              )}
            </figcaption>
          </button>
        </figure>
      )}

      {/* Stats panel — keepsake card, gold-medal avatars, ADD YOURS ticket button */}
      {totalPhotos > 0 && (
        <section className="deco-card mb-10 flex flex-col items-stretch justify-between gap-5 p-7 sm:flex-row sm:items-center">
          <div className="flex flex-col items-start gap-4 sm:gap-5">
            <p className="font-mono text-sm font-bold uppercase tracking-[0.12em] text-primary sm:text-base">
              {totalPhotos} moments from {guestCount} guest{guestCount === 1 ? "" : "s"}
            </p>
            {contributors.length > 0 && (
              <div className="flex items-center">
                {contributors.slice(0, 5).map((c) => (
                  <span key={keyOf(c.name)} className="iy-avatar" title={labelOf(c.name)}>
                    {initials(c.name)}
                  </span>
                ))}
                {guestCount > 5 && <span className="iy-avatar iy-avatar-more">+{guestCount - 5}</span>}
              </div>
            )}
          </div>
          <ButtonLink href="/upload">Add Yours</ButtonLink>
        </section>
      )}

      {/* Filter rail */}
      {contributors.length > 0 && (
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <TabPill
              active={tab === ALL}
              onClick={() => {
                setTab(ALL);
                selectScope(ALL);
              }}
            >
              All photos
            </TabPill>
            <TabPill
              active={tab === "recent"}
              onClick={() => {
                setTab("recent");
                selectScope(ALL); // server already returns newest first
              }}
            >
              Recently added
            </TabPill>
            <ByGuestMenu
              active={tab === "by-guest"}
              activeScope={active}
              contributors={contributors}
              onAll={() => {
                setTab(ALL);
                selectScope(ALL);
              }}
              onPick={(name) => {
                setTab("by-guest");
                selectScope(keyOf(name));
              }}
            />
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <span className="pulse" />
            <span className="font-body text-sm italic text-primary">
              {photos.length} moments on the wall
            </span>
          </div>
        </div>
      )}

      {/* Section separator */}
      <StarRule className="mb-10" />

      {/* Grid */}
      {gridPhotos.length === 0 ? (
        <div className="deco-card p-12 text-center">
          <p className="script text-4xl text-ink">The wall is waiting</p>
          <p className="mt-3 font-body text-base text-ink-soft">Be the first to place a photograph from the celebration.</p>
          <ButtonLink href="/upload" className="mt-6">
            Add your photos
          </ButtonLink>
        </div>
      ) : (
        <div className={cn("columns-2 gap-6 transition-opacity md:columns-3 [&>figure]:mb-6", loading && "opacity-60")}>
          {gridPhotos.map((p, i) => (
            <figure key={p.id} className="iy-tile break-inside-avoid">
              <button
                onClick={() => setIndex(i)}
                className="iy-shot w-full cursor-zoom-in"
                aria-label={p.caption ?? (p.uploaderName ? `Photo by ${p.uploaderName}` : "View photograph")}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.thumbUrl}
                  alt={p.caption ?? (p.uploaderName ? `Photo by ${p.uploaderName}` : "A moment from the day")}
                  loading="lazy"
                />
              </button>
              {/* bottom corner stars (top two come from ::before/::after) */}
              <span className="iy-star-bl" aria-hidden="true" />
              <span className="iy-star-br" aria-hidden="true" />
              <figcaption className="iy-cap">
                <p className="iy-cap-name">
                  <span className="text-primary">★</span> {p.uploaderName ?? "A guest"}
                </p>
                {p.caption && <p className="iy-cap-note">“{p.caption}”</p>}
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      {next != null && (
        <div className="mt-10 flex justify-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-ink underline-offset-[6px] transition hover:text-primary hover:underline disabled:opacity-50"
          >
            {loading ? "Gathering…" : "Show more of the wall →"}
          </button>
        </div>
      )}

      <Lightbox
        open={index >= 0}
        close={() => setIndex(-1)}
        index={Math.max(0, index)}
        slides={toSlides(gridPhotos)}
        plugins={[Captions, Zoom]}
        captions={{ descriptionTextAlign: "center" }}
        styles={lightboxStyles}
      />
      {featured && (
        <Lightbox
          open={featuredOpen}
          close={() => setFeaturedOpen(false)}
          slides={toSlides([featured])}
          plugins={[Captions, Zoom]}
          captions={{ descriptionTextAlign: "center" }}
          styles={lightboxStyles}
        />
      )}
    </div>
  );
}

function TabPill({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "font-mono text-sm font-bold uppercase tracking-[0.1em] transition-colors",
        active ? "nav-active text-primary" : "text-ink hover:text-primary",
      )}
    >
      {children}
    </button>
  );
}

function ByGuestMenu({
  active,
  activeScope,
  contributors,
  onAll,
  onPick,
}: {
  active: boolean;
  activeScope: string;
  contributors: GalleryContributor[];
  onAll: () => void;
  onPick: (name: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const activeName =
    activeScope !== ALL
      ? contributors.find((c) => keyOf(c.name) === activeScope)?.name ?? "Anonymous"
      : null;
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((s) => !s)}
        className={cn(
          "font-mono text-sm font-bold uppercase tracking-[0.1em] transition-colors",
          active ? "nav-active text-primary" : "text-ink hover:text-primary",
        )}
      >
        {activeName ? `By: ${activeName}` : "By guest"} ▾
      </button>
      {open && (
        <div className="deco-card absolute left-0 top-full z-30 mt-3 max-h-72 w-56 overflow-y-auto p-3">
          <button
            onClick={() => {
              setOpen(false);
              onAll();
            }}
            className="block w-full px-2 py-1.5 text-left font-mono text-xs font-bold uppercase tracking-[0.1em] hover:bg-accent/40"
          >
            Everyone
          </button>
          {contributors.map((c) => (
            <button
              key={keyOf(c.name)}
              onClick={() => {
                setOpen(false);
                onPick(c.name);
              }}
              className="block w-full px-2 py-1.5 text-left font-mono text-xs font-bold uppercase tracking-[0.1em] hover:bg-accent/40"
            >
              {labelOf(c.name)} <span className="text-ink-soft">· {c.count}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
