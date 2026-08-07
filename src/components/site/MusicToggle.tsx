"use client";

import { useMusicPlayer } from "./MusicPlayerProvider";

/**
 * Floating background-music control. Its lift used to be a hard-coded navy
 * shadow left over from the pre-rebrand palette; it now tints from the theme's
 * own ink, so it follows an archive year's theme along with everything else.
 */
export function MusicToggle() {
  const { isPlaying, toggle } = useMusicPlayer();

  return (
    <button
      onClick={toggle}
      aria-label={isPlaying ? "Pause background music" : "Play background music"}
      aria-pressed={isPlaying}
      className="fixed bottom-5 right-5 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-gold-deep/40 bg-bg/90 text-gold-deep shadow-[0_6px_18px_color-mix(in_srgb,var(--c-ink)_22%,transparent)] backdrop-blur transition hover:border-gold-deep hover:text-primary"
    >
      {isPlaying ? (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
          <rect x="6" y="5" width="4" height="14" rx="1" />
          <rect x="14" y="5" width="4" height="14" rx="1" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
          <path d="M9 18V6l10-2v11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="6.5" cy="18" r="2.6" />
          <circle cx="16.5" cy="15" r="2.6" />
        </svg>
      )}
    </button>
  );
}
