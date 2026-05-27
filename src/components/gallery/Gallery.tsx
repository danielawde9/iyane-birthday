"use client";

import { useCallback, useState } from "react";
import { MasonryPhotoAlbum } from "react-photo-album";
import "react-photo-album/masonry.css";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Captions from "yet-another-react-lightbox/plugins/captions";
import "yet-another-react-lightbox/plugins/captions.css";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import type { PhotoDTO } from "@/lib/photo";
import { ButtonLink } from "@/components/ui/Button";
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
    fontFamily: "var(--font-serif)",
    fontStyle: "italic",
    fontSize: "1.3rem",
    color: "var(--c-on-dark)",
  },
  captionsDescription: {
    fontFamily: "var(--font-serif-sc)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.26em",
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

export function Gallery({ featured, contributors, initial, nextOffset, totalPhotos, year }: GalleryProps) {
  const [photos, setPhotos] = useState<PhotoDTO[]>(initial);
  const [next, setNext] = useState<number | null>(nextOffset);
  const [active, setActive] = useState<string>(ALL);
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
  const albumPhotos = gridPhotos.map((p) => ({
    src: p.thumbUrl,
    width: p.width,
    height: p.height,
    alt: p.caption ?? (p.uploaderName ? `Photo by ${p.uploaderName}` : "A moment from the day"),
    key: p.id,
  }));

  return (
    <div>
      {/* Featured moment */}
      {featured && active === ALL && (
        <figure className="mx-auto mb-14 max-w-4xl">
          <p className="eyebrow eyebrow-mute mb-3 text-center">A moment from the room</p>
          <button
            onClick={() => setFeaturedOpen(true)}
            className="group relative block w-full overflow-hidden border border-[color:var(--c-gold-rule)] bg-paper-deep"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={featured.url}
              alt={featured.caption ?? "Featured moment"}
              className="max-h-[62vh] w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              style={{ filter: "saturate(0.92) contrast(1.02)" }}
            />
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-primary/85 via-primary/25 to-transparent p-6 text-left sm:p-8">
              {featured.caption && <p className="h-title text-2xl text-on-dark sm:text-3xl">{featured.caption}</p>}
              {featured.uploaderName && (
                <p className="mt-1.5 font-sc text-[11px] uppercase tracking-[0.26em] text-accent-bright">
                  — Photo by {featured.uploaderName}
                </p>
              )}
            </figcaption>
          </button>
        </figure>
      )}

      {/* Contribution banner */}
      {totalPhotos > 0 && (
        <div className="mx-auto mb-8 flex max-w-5xl flex-col items-center justify-between gap-5 border-y border-[color:var(--c-gold-rule-faint)] px-1 py-6 sm:flex-row">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-5">
            {contributors.length > 0 && (
              <div className="flex items-center">
                {contributors.slice(0, 6).map((c) => (
                  <span
                    key={keyOf(c.name)}
                    className="iy-avatar"
                    style={{ background: "var(--c-primary)" }}
                    title={labelOf(c.name)}
                  >
                    {initials(c.name)}
                  </span>
                ))}
                {guestCount > 6 && <span className="iy-avatar iy-avatar-more">+{guestCount - 6}</span>}
              </div>
            )}
            <p className="h-title text-center text-xl text-ink sm:text-left sm:text-2xl">
              <span className="font-sc not-italic text-gold-deep">{totalPhotos}</span> moment{totalPhotos === 1 ? "" : "s"}
              {guestCount > 0 && (
                <>
                  {" "}
                  from <span className="font-sc not-italic text-gold-deep">{guestCount}</span> guest
                  {guestCount === 1 ? "" : "s"}
                </>
              )}
            </p>
          </div>
          <ButtonLink href="/upload" variant="gold">
            + Add Yours
          </ButtonLink>
        </div>
      )}

      {/* Filter rail — browse all, or by guest */}
      {contributors.length > 0 && (
        <div className="mb-9 flex snap-x gap-4 overflow-x-auto pb-2 sm:justify-center">
          <ScopeSeal label="Everyone" count={totalPhotos} active={active === ALL} onClick={() => selectScope(ALL)} />
          {contributors.map((c) => (
            <ScopeSeal
              key={keyOf(c.name)}
              label={labelOf(c.name)}
              count={c.count}
              cover={c.coverUrl}
              active={active === keyOf(c.name)}
              onClick={() => selectScope(keyOf(c.name))}
            />
          ))}
        </div>
      )}

      {/* Grid */}
      {gridPhotos.length === 0 ? (
        <div className="border border-dashed border-[color:var(--c-gold-rule)] bg-surface p-16 text-center">
          <p className="script text-5xl text-ink">The wall is waiting</p>
          <p className="mt-3 text-ink-soft">Be the first to place a photograph from the celebration.</p>
          <ButtonLink href="/upload" variant="navy" className="mt-6">
            Add your photos
          </ButtonLink>
        </div>
      ) : (
        <div className={cn("iy-album transition-opacity", loading && "opacity-60")}>
          <MasonryPhotoAlbum
            photos={albumPhotos}
            columns={(width) => (width < 480 ? 2 : width < 900 ? 3 : 4)}
            spacing={1}
            onClick={({ index: i }) => setIndex(i)}
            render={{
              extras: (_, { index: i }) => {
                const p = gridPhotos[i];
                if (!p) return null;
                return (
                  <>
                    <span className="iy-badge" aria-hidden="true">
                      {initials(p.uploaderName)}
                    </span>
                    {p.uploaderName && (
                      <figcaption className="iy-attr">
                        <span className="dash">—</span> Added by {p.uploaderName}
                      </figcaption>
                    )}
                  </>
                );
              },
            }}
          />
        </div>
      )}

      {next != null && (
        <div className="mt-10 flex justify-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="font-sc text-[11px] uppercase tracking-[0.28em] text-ink underline-offset-[6px] transition hover:text-gold-deep hover:underline disabled:opacity-50"
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

function ScopeSeal({
  label,
  count,
  cover,
  active,
  onClick,
}: {
  label: string;
  count: number;
  cover?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="flex w-[72px] shrink-0 snap-start flex-col items-center gap-2 text-center">
      <span
        className={cn(
          "relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full transition",
          active ? "ring-1 ring-accent ring-offset-4 ring-offset-bg" : "opacity-90 hover:opacity-100",
        )}
      >
        <span className={cn("absolute inset-0 rounded-full border", active ? "border-accent" : "border-accent/45")} />
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt={label} className="h-full w-full rounded-full object-cover" style={{ filter: "saturate(0.92)" }} />
        ) : (
          <span className="flex h-full w-full items-center justify-center rounded-full bg-primary font-sc text-[11px] uppercase tracking-[0.1em] text-accent">
            {label === "Everyone" ? "ALL" : initials(label)}
          </span>
        )}
      </span>
      <span className={cn("max-w-full truncate font-sc text-[10px] uppercase tracking-[0.18em]", active ? "text-ink" : "text-muted")}>
        {label}
      </span>
    </button>
  );
}
