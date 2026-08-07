"use client";

import { useEffect, useState } from "react";
import type { PhotoDTO } from "@/lib/photo";
import { PhotoStage } from "@/components/media/PhotoStage";
import { PhotoControls, PhotoProgress } from "@/components/media/PhotoControls";
import { useRotation } from "@/lib/useRotation";

const INTERVAL = 6500;
const REFRESH_MS = 30_000;

/**
 * The rotating photo wall that opens /gallery: guest photographs shown WHOLE
 * (never cropped) over a blurred backdrop of themselves, auto-advancing and
 * quietly refreshing as new ones arrive.
 *
 * It carries almost no furniture on purpose — just the photo credit and the
 * transport controls. It used to also float an "Admit One" QR, a crest, a
 * tagline and a guest count over the image; every one of those either repeats
 * something the page below already says or competes with the photograph, which
 * is the only thing here worth looking at.
 *
 * Renders nothing at all when there are no photos: the wall underneath has its
 * own empty state, and two "be the first" prompts stacked on one page is one
 * too many.
 */
export function LivingGallery({ photos: initial }: { photos: PhotoDTO[] }) {
  const [photos, setPhotos] = useState<PhotoDTO[]>(initial);
  const { index, isPlaying, toggle, next, prev } = useRotation(photos.length, { intervalMs: INTERVAL });

  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res = await fetch("/api/photos?limit=60");
        const data = (await res.json()) as { photos: PhotoDTO[] };
        if (Array.isArray(data.photos) && data.photos.length > 0) setPhotos(data.photos);
      } catch {
        /* keep current photos */
      }
    }, REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  if (photos.length === 0) return null;

  const current = photos[index % photos.length]!;

  return (
    // Full-bleed. The negative top margin cancels the header's bottom gap so the
    // dark ground butts flush against the marquee — but the PHOTO is inset below
    // it, so the painted valance hangs over empty ground rather than clipping the
    // top of someone's photograph.
    //
    // A three-row column, not a stack of absolutely-positioned overlays: header
    // clearance, then the photo, then the credit and transport on the dark ground
    // BELOW it. Nothing covers the picture.
    <section className="relative -mt-6 flex min-h-[70svh] w-full flex-col overflow-hidden bg-projector-deep text-on-dark sm:min-h-[78svh]">
      {/* Clearance for the header's painted valance, which hangs ~44px down. */}
      <div className="h-14 shrink-0 sm:h-16" aria-hidden="true" />

      <div className="relative min-h-0 w-full flex-1">
        <PhotoStage photo={current} />
        {photos.length > 1 && <PhotoProgress index={index} isPlaying={isPlaying} intervalMs={INTERVAL} />}
      </div>

      {/* Credit + transport. The three-column grid keeps the buttons optically
          centred on the page regardless of how long the photographer's name is. */}
      <div className="z-20 flex shrink-0 flex-col items-center gap-4 px-4 py-5 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:px-8">
        <p className="min-w-0 truncate font-body text-base italic text-on-dark/90 sm:justify-self-start sm:text-lg">
          {current.uploaderName ? (
            <>
              Photo by <span className="font-bold not-italic text-accent-bright">{current.uploaderName}</span>
            </>
          ) : (
            <>Come one, come all</>
          )}
        </p>

        {photos.length > 1 ? (
          <PhotoControls isPlaying={isPlaying} onToggle={toggle} onPrev={prev} onNext={next} />
        ) : (
          <span />
        )}

        {/* Balances the grid so the controls sit dead centre. */}
        <span className="hidden sm:block" aria-hidden="true" />
      </div>
    </section>
  );
}
