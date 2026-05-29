"use client";

import { useEffect, useState } from "react";
import type { PhotoDTO } from "@/lib/photo";

/**
 * Shows a photo WHOLE (never cropped) over a blurred, darkened copy of itself
 * that fills the rest of the frame — works for any aspect ratio on desktop and
 * mobile. Crossfades between photos. Fills its positioned parent (absolute inset-0).
 */
export function PhotoStage({ photo }: { photo: PhotoDTO | null }) {
  // Keep up to two layers so the incoming photo can fade in over the outgoing.
  const [layers, setLayers] = useState<PhotoDTO[]>(photo ? [photo] : []);

  useEffect(() => {
    if (!photo) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- needed to add the incoming photo as a crossfade layer.
    setLayers((prev) => {
      if (prev[prev.length - 1]?.id === photo.id) return prev;
      return [...prev.slice(-1), photo];
    });
  }, [photo]);

  useEffect(() => {
    if (layers.length <= 1) return;
    const t = setTimeout(() => setLayers((l) => l.slice(-1)), 750);
    return () => clearTimeout(t);
  }, [layers]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-primary-deep">
      {layers.map((p, i) => {
        const isTop = i === layers.length - 1;
        return (
          <div key={p.id} className={`absolute inset-0 ${isTop && layers.length > 1 ? "photo-fade" : ""}`}>
            {/* Blurred, darkened fill */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.url}
              alt=""
              aria-hidden="true"
              className="photo-kb-bg absolute inset-0 h-full w-full object-cover blur-2xl brightness-[0.45]"
            />
            {/* The whole photo, uncropped */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.url}
              alt={p.caption ?? "A moment from the celebration"}
              className="absolute inset-0 h-full w-full object-contain p-3 sm:p-6"
            />
          </div>
        );
      })}
    </div>
  );
}
