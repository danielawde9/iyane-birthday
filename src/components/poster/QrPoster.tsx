"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

/**
 * A printable Grand Jubilee playbill with a QR code that opens the upload page.
 * Heavy hierarchy in the style of a 1920s big-top playbill: scalloped banners
 * top and bottom, ink frame with corner stars, a "Presenting" eyebrow stack,
 * massive wood-type IYANE headline, a folded ribbon billing the year, an
 * "Admit One" ticket-stub around the QR, and serial-number fine print.
 */
export function QrPoster() {
  const [qr, setQr] = useState<string | null>(null);

  useEffect(() => {
    QRCode.toDataURL(`${window.location.origin}/upload`, { margin: 1, width: 560, color: { dark: "#221B03", light: "#FFF8F0" } })
      .then(setQr)
      .catch(() => setQr(null));
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bg p-6 print:bg-white print:p-0">
      <button
        onClick={() => window.print()}
        className="btn-ticket print:hidden"
      >
        Print this Poster
      </button>

      <article
        className="poster-article relative w-full max-w-[760px] overflow-hidden bg-paper-deep text-ink print:max-w-none"
      >
        {/* heavy ink frame + 1px ink inner stroke (the "misregistered print" feel) */}
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            border: "10px solid var(--c-ink)",
            boxShadow: "inset 0 0 0 4px var(--c-bg), inset 0 0 0 5px var(--c-ink), inset 0 0 0 14px var(--c-bg), inset 0 0 0 15px var(--c-accent)",
          }}
        />

        {/* corner ink stars */}
        <Star className="absolute -left-3 -top-3 z-20 h-8 w-8 text-ink" />
        <Star className="absolute -right-3 -top-3 z-20 h-8 w-8 text-ink" />
        <Star className="absolute -bottom-3 -left-3 z-20 h-8 w-8 text-ink" />
        <Star className="absolute -bottom-3 -right-3 z-20 h-8 w-8 text-ink" />

        {/* top red banner with scalloped bottom edge */}
        <div
          className="relative z-[1] mx-[24px] mt-[24px] bg-primary px-4 py-3 text-center sm:px-6"
          style={{ borderBottom: "3px solid var(--c-ink)" }}
        >
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-accent sm:text-sm sm:tracking-[0.32em]">
            <span className="text-accent">★</span> Step Right Up · The Greatest Little Show <span className="text-accent">★</span>
          </p>
        </div>
        {/* yellow scalloped strip dangling off the banner */}
        <div className="relative z-[1] mx-[24px] h-4">
          <ScallopRow />
        </div>

        {/* Body */}
        <div className="relative flex flex-col items-center px-6 py-10 text-center sm:px-12 sm:py-12">
          {/* Eyebrow billing */}
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.34em] text-ink">
            One Night Only
          </p>
          <p className="mt-3 font-body text-base italic text-ink-soft">
            The producers presenting
          </p>

          {/* Massive wood-type IYANE */}
          <h1
            className="mt-4 font-display font-bold uppercase leading-none text-primary"
            style={{
              fontSize: "clamp(44px, 12vw, 136px)",
              letterSpacing: "-0.02em",
              textShadow: "3px 3px 0 var(--c-ink)",
            }}
          >
            IYANE
          </h1>

          <p className="mt-3 font-body text-xl italic text-ink sm:text-4xl">
            the one &amp; only
          </p>

          {/* Folded ribbon billing the year */}
          <div className="relative mt-5 w-full max-w-[320px] sm:w-80">
            <svg viewBox="0 0 320 56" preserveAspectRatio="none" className="h-12 w-full" aria-hidden="true">
              <polygon points="0,8 16,28 0,48 8,28" fill="var(--c-primary-deep)" />
              <polygon points="320,8 304,28 320,48 312,28" fill="var(--c-primary-deep)" />
              <polygon points="6,4 314,4 304,28 314,52 6,52 16,28" fill="var(--c-primary)" stroke="var(--c-ink)" strokeWidth="2" />
              <polygon points="16,12 304,12 296,28 304,44 16,44 24,28" fill="none" stroke="var(--c-accent)" strokeWidth="1" opacity="0.85" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="whitespace-nowrap font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-on-dark sm:text-sm sm:tracking-[0.2em]">
                The Grand Jubilee · MMXXVI
              </span>
            </div>
          </div>

          {/* Ink rule with star */}
          <div className="my-7 flex w-full max-w-md items-center gap-3 px-4">
            <span className="h-[2px] flex-1 bg-ink" />
            <span className="text-primary text-base leading-none">★</span>
            <span className="h-[2px] flex-1 bg-ink" />
          </div>

          {/* Action headline */}
          <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-ink sm:text-3xl">
            Add Your Photographs
          </h2>
          <p className="mt-3 max-w-sm font-body text-sm italic text-ink/85 sm:text-base">
            Scan with your phone&apos;s camera to place your photos from the day on the wall.
          </p>

          {/* QR ticket stub */}
          <div className="relative mt-7 flex items-center justify-center">
            <div className="ticket-stub relative bg-bg p-3 sm:-rotate-2 print:bg-white">
              <span className="admit-stamp absolute -top-3 left-1 sm:-left-4 sm:-top-4">Admit One</span>
              {qr ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qr} alt="QR code to the photo upload page" className="h-40 w-40 sm:h-56 sm:w-56" />
              ) : (
                <div className="flex h-40 w-40 items-center justify-center font-mono text-xs font-bold uppercase tracking-[0.18em] text-ink/40 sm:h-56 sm:w-56">
                  Generating…
                </div>
              )}
              <p className="mt-2 text-center font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-ink-soft">
                No. 001 · Series A
              </p>
            </div>
          </div>
        </div>

        {/* bottom scalloped strip (above the bottom banner in flow) */}
        <div className="relative z-[1] mx-[24px] h-4">
          <ScallopRow flip />
        </div>
        {/* bottom red banner */}
        <div
          className="relative z-[1] mx-[24px] mb-[24px] bg-primary px-4 py-3 text-center sm:px-6"
          style={{ borderTop: "3px solid var(--c-ink)" }}
        >
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-accent sm:text-sm sm:tracking-[0.32em]">
            <span className="text-accent">★</span> Stars Encouraged · Sunday Best · MMXXVI <span className="text-accent">★</span>
          </p>
        </div>
      </article>
    </div>
  );
}

function ScallopRow({ flip = false }: { flip?: boolean }) {
  return (
    <svg viewBox="0 0 720 16" preserveAspectRatio="none" className="h-full w-full" aria-hidden="true">
      {Array.from({ length: 30 }).map((_, i) => {
        const cx = i * 24 + 12;
        return (
          <path
            key={i}
            d={flip ? `M ${cx - 12} 16 A 12 12 0 0 1 ${cx + 12} 16 Z` : `M ${cx - 12} 0 A 12 12 0 0 0 ${cx + 12} 0 Z`}
            fill="var(--c-accent)"
            stroke="var(--c-ink)"
            strokeWidth="1"
          />
        );
      })}
    </svg>
  );
}

function Star({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <polygon
        points="12,2 14.5,9 22,9 16,13.5 18.5,21 12,16.5 5.5,21 8,13.5 2,9 9.5,9"
        fill="currentColor"
      />
    </svg>
  );
}
