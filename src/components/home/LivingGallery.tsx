"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import type { PhotoDTO } from "@/lib/photo";
import { Crest } from "@/components/brand/Crest";
import { PhotoStage } from "@/components/media/PhotoStage";
import { PhotoControls } from "@/components/media/PhotoControls";
import { useRotation } from "@/lib/useRotation";

const INTERVAL = 6500;

/**
 * The home page: a full-bleed wall of guest photos shown WHOLE (never cropped)
 * over a blurred backdrop, with play/pause + next/prev controls and elegant gold
 * overlays. Auto-refreshes for new uploads.
 */
export function LivingGallery({
  photos: initial,
  guestCount,
  yearLabel,
}: {
  photos: PhotoDTO[];
  guestCount: number;
  yearLabel: string;
}) {
  const [photos, setPhotos] = useState<PhotoDTO[]>(initial);
  const [qr, setQr] = useState<string | null>(null);
  const { index, isPlaying, toggle, next, prev } = useRotation(photos.length, { intervalMs: INTERVAL });

  useEffect(() => {
    const url = `${window.location.origin}/upload`;
    QRCode.toDataURL(url, { margin: 1, width: 220, color: { dark: "#15233b", light: "#f4ecd8" } })
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
  const shadow = "drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]";

  return (
    <div className="fixed inset-0 overflow-hidden bg-primary-deep text-on-dark">
      {/* Uncropped photo + blurred backdrop */}
      {hasPhotos ? (
        <PhotoStage photo={current} />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,#1c2f4f,#0c1626_70%)]" />
      )}

      {/* Vignette for legibility */}
      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-black/55 via-transparent to-black/70" />

      {/* Controls */}
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

      {/* Top-left: mark + nav */}
      <div className={`absolute left-5 top-5 z-20 flex flex-col gap-2 sm:left-8 sm:top-7 ${shadow}`}>
        <Link href="/gallery" className="flex items-center gap-3">
          <Crest className="h-10 w-10 sm:h-12 sm:w-12" />
          <span className="leading-tight">
            <span className="block font-display text-xl tracking-[0.3em] text-accent sm:text-2xl">IYANE</span>
            <span className="block font-script text-lg text-accent/90 sm:text-xl">{yearLabel}</span>
          </span>
        </Link>
        <nav className="flex items-center gap-3 text-[10px] uppercase tracking-[0.25em] text-on-dark/75">
          <Link href="/gallery" className="hover:text-accent">Gallery</Link>
          <span className="text-accent/50">·</span>
          <Link href="/guestbook" className="hover:text-accent">Wishes</Link>
          <span className="text-accent/50">·</span>
          <Link href="/details" className="hover:text-accent">Details</Link>
        </nav>
      </div>

      {/* Top-right: live guest count */}
      {hasPhotos && guestCount > 0 && (
        <p className={`absolute right-5 top-6 z-20 max-w-[42%] text-right font-display text-sm italic text-accent/90 sm:right-8 sm:text-base ${shadow}`}>
          now showing photos from {guestCount} guest{guestCount === 1 ? "" : "s"}
        </p>
      )}

      {/* Bottom-left: photo credit */}
      {current?.uploaderName && (
        <p className={`absolute bottom-6 left-5 z-20 font-display text-sm italic text-on-dark/90 sm:bottom-8 sm:left-8 sm:text-base ${shadow}`}>
          Photo by {current.uploaderName}
        </p>
      )}

      {/* Bottom-right: add your photos + QR */}
      <div className="absolute bottom-5 right-5 z-20 flex items-center gap-3 sm:bottom-8 sm:right-8 sm:gap-4">
        <Link href="/upload" className={`text-right ${shadow}`}>
          <span className="block font-display text-xl text-accent sm:text-2xl">Add your photos</span>
          <span className="block font-display text-xs italic text-on-dark/80 sm:text-sm">scan to upload</span>
        </Link>
        {qr && (
          <Link href="/upload" aria-label="Add your photos" className="shrink-0 rounded-[3px] bg-[#f4ecd8] p-1.5 shadow-lg ring-1 ring-black/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="QR code to upload photos" className="h-16 w-16 sm:h-20 sm:w-20" />
          </Link>
        )}
      </div>

      {/* Empty state */}
      {!hasPhotos && (
        <div className={`absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 px-6 text-center ${shadow}`}>
          <Crest className="h-24 w-24" />
          <p className="font-script text-3xl text-accent/90 sm:text-4xl">The album is waiting for its first photo</p>
          <Link
            href="/upload"
            className="mt-1 rounded-[3px] bg-accent px-6 py-3 text-xs uppercase tracking-[0.22em] text-primary-deep transition hover:bg-accent-bright"
          >
            Add your photos
          </Link>
        </div>
      )}
    </div>
  );
}
