"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { saveMusicPref } from "@/lib/music-prefs";

const TARGET_VOLUME = 0.35;
const FADE_MS = 600;

type MusicContextValue = { isPlaying: boolean; toggle: () => void };
const MusicContext = createContext<MusicContextValue | null>(null);

export function useMusicPlayer(): MusicContextValue {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error("useMusicPlayer must be used within MusicPlayerProvider");
  return ctx;
}

/** Linear volume ramp to avoid clicks on start/stop. Returns a canceller for the interval. */
function fade(audio: HTMLAudioElement, to: number, ms: number, done?: () => void): () => void {
  const steps = 24;
  const start = audio.volume;
  const delta = (to - start) / steps;
  let i = 0;
  const id = window.setInterval(() => {
    i += 1;
    audio.volume = Math.min(1, Math.max(0, start + delta * i));
    if (i >= steps) {
      window.clearInterval(id);
      done?.();
    }
  }, ms / steps);
  return () => window.clearInterval(id);
}

export function MusicPlayerProvider({ src, children }: { src: string; children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cancelFadeRef = useRef<(() => void) | null>(null);
  // True while an audio.play() is in flight, so overlapping triggers don't double-start.
  const startPendingRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);

  function cancelFade() {
    cancelFadeRef.current?.();
    cancelFadeRef.current = null;
  }

  /** Start playback with a fade-in. Only ever called from a user gesture (the toggle). */
  function startPlayback() {
    const audio = audioRef.current;
    if (!audio || startPendingRef.current) return;
    cancelFade();
    startPendingRef.current = true;
    audio.volume = 0;
    audio
      .play()
      .then(() => {
        startPendingRef.current = false;
        setIsPlaying(true);
        cancelFadeRef.current = fade(audio, TARGET_VOLUME, FADE_MS);
      })
      .catch(() => {
        startPendingRef.current = false;
        setIsPlaying(false);
      });
  }

  function stopPlayback() {
    const audio = audioRef.current;
    if (!audio) return;
    cancelFade();
    setIsPlaying(false);
    cancelFadeRef.current = fade(audio, 0, FADE_MS, () => audio.pause());
  }

  function toggle() {
    if (isPlaying) {
      stopPlayback();
      saveMusicPref(window.localStorage, "off");
    } else {
      startPlayback();
      saveMusicPref(window.localStorage, "on");
    }
  }

  // Music stays off by default — it only starts when the listener clicks the toggle.
  // No autoplay, no "start on first interaction". Just cancel any in-flight fade on unmount.
  useEffect(() => cancelFade, []);

  return (
    <MusicContext.Provider value={{ isPlaying, toggle }}>
      <audio ref={audioRef} src={src} loop preload="none" aria-hidden="true" />
      {children}
    </MusicContext.Provider>
  );
}
