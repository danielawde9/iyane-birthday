"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Crest } from "@/components/brand/Crest";

/** A printable sign with a QR code that opens the upload page. */
export function QrPoster() {
  const [qr, setQr] = useState<string | null>(null);
  const [url, setUrl] = useState("");

  useEffect(() => {
    const uploadUrl = `${window.location.origin}/upload`;
    QRCode.toDataURL(uploadUrl, { margin: 1, width: 560, color: { dark: "#0E2240", light: "#ffffff" } })
      .then((dataUrl) => {
        setUrl(uploadUrl);
        setQr(dataUrl);
      })
      .catch(() => setQr(null));
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bg p-6 print:bg-white">
      <button
        onClick={() => window.print()}
        className="border border-accent px-6 py-3 font-sc text-[11px] uppercase tracking-[0.26em] text-ink transition hover:bg-accent hover:text-bg print:hidden"
      >
        Print this poster
      </button>

      <div className="relative flex w-full max-w-[680px] flex-col items-center bg-primary px-10 py-14 text-center text-on-dark shadow-xl ring-1 ring-accent print:shadow-none">
        {/* inner gold hairline frame */}
        <span className="pointer-events-none absolute inset-3 border border-accent/35" aria-hidden="true" />

        <Crest className="h-24 w-24" />
        <p className="script mt-4 text-6xl text-accent">Iyane</p>
        <p className="font-sc text-[11px] uppercase tracking-[0.4em] text-on-dark/75">Year One · MMXXVI</p>

        <hr className="rule-gold my-8 w-full max-w-xs" />

        <h1 className="h-title text-3xl text-on-dark">Add your photographs</h1>
        <p className="mt-3 max-w-sm font-display text-lg italic text-on-dark/80">
          Scan with your phone&apos;s camera to place your photos from the day on the wall.
        </p>

        <div className="mt-7 bg-white p-4 ring-1 ring-accent">
          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr} alt="QR code to the photo upload page" className="h-56 w-56" />
          ) : (
            <div className="flex h-56 w-56 items-center justify-center font-sc text-[11px] uppercase tracking-[0.2em] text-primary/40">
              Generating…
            </div>
          )}
        </div>

        <p className="mt-5 break-all font-sc text-[11px] uppercase tracking-[0.18em] text-accent">{url}</p>
      </div>
    </div>
  );
}
