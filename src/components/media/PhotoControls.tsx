"use client";

import type { ReactNode } from "react";

/**
 * The slideshow's transport, split into two pieces the caller places itself.
 *
 * They used to be one absolutely-positioned unit floating over the photograph.
 * They are separate now so the buttons can sit on the dark ground BELOW the
 * photo rather than covering it — see LivingGallery.
 */

/** Thin progress bar. Restarts on each photo and freezes when paused. Needs a
 *  positioned parent; pin it to the top of the photo area. */
export function PhotoProgress({
  index,
  isPlaying,
  intervalMs = 6500,
}: {
  index: number;
  isPlaying: boolean;
  intervalMs?: number;
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-30 h-[3px] bg-white/10">
      <div
        key={index}
        className="progress-fill h-full bg-accent"
        style={{ animationDuration: `${intervalMs}ms`, animationPlayState: isPlaying ? "running" : "paused" }}
      />
    </div>
  );
}

interface PhotoControlsProps {
  isPlaying: boolean;
  onToggle: () => void;
  onPrev: () => void;
  onNext: () => void;
}

/** Prev / play-pause / next. Renders inline — the caller positions it. */
export function PhotoControls({ isPlaying, onToggle, onPrev, onNext }: PhotoControlsProps) {
  return (
    <div className="flex items-center gap-3">
      <CtrlButton label="Previous photo" onClick={onPrev}>
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
          <path d="M18 5 9 12l9 7z" />
          <rect x="5" y="5" width="2.4" height="14" rx="1" />
        </svg>
      </CtrlButton>

      <CtrlButton label={isPlaying ? "Pause" : "Play"} onClick={onToggle} big>
        {isPlaying ? (
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </CtrlButton>

      <CtrlButton label="Next photo" onClick={onNext}>
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
          <path d="M6 5l9 7-9 7z" />
          <rect x="16.6" y="5" width="2.4" height="14" rx="1" />
        </svg>
      </CtrlButton>
    </div>
  );
}

function CtrlButton({
  label,
  onClick,
  big,
  children,
}: {
  label: string;
  onClick: () => void;
  big?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`flex items-center justify-center rounded-full border-2 border-accent/55 bg-primary-deep/70 text-accent-bright transition hover:border-accent hover:bg-primary-deep hover:text-on-dark ${
        big ? "h-14 w-14" : "h-11 w-11"
      }`}
    >
      {children}
    </button>
  );
}
