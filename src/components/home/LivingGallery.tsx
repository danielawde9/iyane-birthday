"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import type { PhotoDTO } from "@/lib/photo";
import { CrestSmall } from "@/components/brand/Crest";
import { PhotoStage } from "@/components/media/PhotoStage";
import { PhotoControls } from "@/components/media/PhotoControls";
import { useRotation } from "@/lib/useRotation";

const INTERVAL = 6500;

/**
 * The home hero: a full-bleed wall of guest photos shown WHOLE (never cropped)
 * over a blurred backdrop, with the "Grand Jubilee" ink + gold corner stamps,
 * an "Admit One" QR ticket, and a Caslon photo credit along the bottom.
 *
 * It renders INSIDE the shared (site) chrome — the SiteHeader sits above it and
 * the SiteFooter below — so the home page carries the same header, nav, and
 * footer as every other page. It fills the viewport below the header and
 * auto-refreshes as new photos arrive.
 */
export function LivingGallery({
  photos: initial,
  guestCount,
}: {
  photos: PhotoDTO[];
  guestCount: number;
}) {
  const [photos, setPhotos] = useState<PhotoDTO[]>(initial);
  const [qr, setQr] = useState<string | null>(null);
  const { index, isPlaying, toggle, next, prev } = useRotation(photos.length, { intervalMs: INTERVAL });

  useEffect(() => {
    const url = `${window.location.origin}/upload`;
    QRCode.toDataURL(url, { margin: 1, width: 220, color: { dark: "#221B03", light: "#FFF8F0" } })
      .then(setQr)
      .catch(() => setQr(null));
  }, []);

  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res = await fetch("/api/photos?limit=60");
        const data = (await res.json()) as { photos: PhotoDTO[] };
        if (Array.isArray(data.photos) && data.photos.length > 0) setPhotos(data.photos);
      } catch {
        /* keep current photos */
      }
    }, 30000);
    return () => clearInterval(id);
  }, []);

  const hasPhotos = photos.length > 0;
  const current = hasPhotos ? photos[index % photos.length]! : null;
  const shadow = "drop-shadow-[0_2px_10px_rgba(0,0,0,0.75)]";

  return (
    // Full-bleed hero that fills the screen below the shared SiteHeader. The
    // negative top margin cancels the header's bottom gap so the slideshow butts
    // flush against the red marquee.
    <section className="relative -mt-6 w-full overflow-hidden bg-projector-deep text-on-dark min-h-[calc(100svh-78px)] sm:min-h-[calc(100svh-88px)]">
      {/* Uncropped photo + blurred backdrop */}
      {hasPhotos ? (
        <PhotoStage photo={current} />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,#7a1a1f,#410003_70%)]" />
      )}

      {/* Soft vignette */}
      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-black/30 via-transparent to-black/60" />

      {/* Controls (centered) */}
      {photos.length > 1 && (
        <PhotoControls
          isPlaying={isPlaying}
          index={index}
          intervalMs={INTERVAL}
          onToggle={toggle}
          onPrev={prev}
          onNext={next}
        />
      )}

      {/* Floating right-side ADMIT ONE QR — desktop only */}
      <div className="absolute bottom-20 right-8 z-20 hidden items-end gap-4 lg:flex">
        <Link href="/upload" className={`text-right ${shadow}`}>
          <span className="block font-display text-3xl font-bold uppercase tracking-[0.08em] text-accent">
            Add Your Photos
          </span>
          <span className="block font-mono text-xs font-bold uppercase tracking-[0.22em] text-on-dark/85">
            Scan to upload
          </span>
        </Link>
        {qr && (
          <Link
            href="/upload"
            aria-label="Add your photos"
            className="ticket-stub relative -rotate-3 transition-transform hover:rotate-0"
            style={{ padding: "10px", background: "var(--c-bg)" }}
          >
            <span className="admit-stamp absolute -left-3 -top-3">Admit One</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="QR code to upload photos" className="h-20 w-20" />
          </Link>
        )}
      </div>

      {/* Floating left-side mark — desktop only */}
      <div className={`absolute bottom-20 left-8 z-20 hidden items-center gap-3 lg:flex ${shadow}`}>
        <CrestSmall className="h-12 w-20 text-accent" />
        <span className="font-body text-lg italic text-on-dark/85">The Grand Jubilee</span>
      </div>

      {/* Bottom caption: photo credit on the left, guest count on the right.
          A simple gradient bar — NOT a second footer (the SiteFooter renders below). */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/70 via-black/30 to-transparent">
        <div className="pointer-events-auto mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 pr-20 pb-5 pt-16 sm:px-8">
          <p className={`min-w-0 truncate font-body text-sm italic text-on-dark/90 sm:text-base ${shadow}`}>
            {current?.uploaderName ? (
              <>Photo by <span className="font-bold not-italic text-accent">{current.uploaderName}</span></>
            ) : (
              <>An evening under the big top</>
            )}
          </p>
          {hasPhotos && guestCount > 0 && (
            <p className={`shrink-0 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-on-dark sm:text-sm sm:tracking-[0.2em] ${shadow}`}>
              <span className="text-accent">★</span> {guestCount} guest{guestCount === 1 ? "" : "s"}
            </p>
          )}
        </div>
      </div>

      {/* Empty state */}
      {!hasPhotos && (
        <div className={`absolute inset-0 z-20 flex flex-col items-center justify-center gap-6 px-6 text-center ${shadow}`}>
          <CrestSmall className="h-20 w-32" />
          <p className="font-body text-3xl italic text-accent sm:text-4xl">
            The big top is empty — be the first under the lights
          </p>
          <Link href="/upload" className="btn-ticket">
            Add Your Photos
          </Link>
        </div>
      )}
    </section>
  );
}
