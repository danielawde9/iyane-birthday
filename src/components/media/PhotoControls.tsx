"use client";

import type { ReactNode } from "react";

interface PhotoControlsProps {
  isPlaying: boolean;
  index: number;
  intervalMs?: number;
  onToggle: () => void;
  onPrev: () => void;
  onNext: () => void;
}

/** Top progress bar + a bottom-center prev / play-pause / next cluster. */
export function PhotoControls({ isPlaying, index, intervalMs = 6500, onToggle, onPrev, onNext }: PhotoControlsProps) {
  return (
    <>
      {/* Progress bar (restarts each photo; freezes when paused) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 h-[3px] bg-white/10">
        <div
          key={index}
          className="progress-fill h-full bg-accent"
          style={{ animationDuration: `${intervalMs}ms`, animationPlayState: isPlaying ? "running" : "paused" }}
        />
      </div>

      {/* Controls */}
      <div className="absolute bottom-24 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 sm:bottom-8">
        <CtrlButton label="Previous photo" onClick={onPrev}>
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
            <path d="M18 5 9 12l9 7z" />
            <rect x="5" y="5" width="2.4" height="14" rx="1" />
          </svg>
        </CtrlButton>

        <CtrlButton label={isPlaying ? "Pause" : "Play"} onClick={onToggle} big>
          {isPlaying ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </CtrlButton>

        <CtrlButton label="Next photo" onClick={onNext}>
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
            <path d="M6 5l9 7-9 7z" />
            <rect x="16.6" y="5" width="2.4" height="14" rx="1" />
          </svg>
        </CtrlButton>
      </div>
    </>
  );
}

function CtrlButton({ label, onClick, big, children }: { label: string; onClick: () => void; big?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`flex items-center justify-center rounded-full border border-accent/40 bg-primary-deep/55 text-accent backdrop-blur transition hover:bg-primary-deep/85 hover:text-accent-bright ${
        big ? "h-12 w-12" : "h-10 w-10"
      }`}
    >
      {children}
    </button>
  );
}
