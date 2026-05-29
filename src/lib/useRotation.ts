"use client";

import { useCallback, useEffect, useState } from "react";

export interface Rotation {
  index: number;
  isPlaying: boolean;
  toggle: () => void;
  next: () => void;
  prev: () => void;
}

/**
 * Drives an auto-advancing photo rotation with play/pause + manual next/prev.
 * Manual navigation resets the timer; the index is clamped when the list changes
 * (it grows via the gallery's periodic refetch). Optional keyboard control.
 */
export function useRotation(count: number, opts: { intervalMs?: number; keyboard?: boolean } = {}): Rotation {
  const intervalMs = opts.intervalMs ?? 6500;
  const [index, setIndex] = useState(0);
  const [isPlaying, setPlaying] = useState(true);

  // Keep the index valid as the list size changes.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- clamps state after the photo count changes.
    setIndex((i) => (count > 0 ? i % count : 0));
  }, [count]);

  const next = useCallback(() => setIndex((i) => (count > 0 ? (i + 1) % count : 0)), [count]);
  const prev = useCallback(() => setIndex((i) => (count > 0 ? (i - 1 + count) % count : 0)), [count]);
  const toggle = useCallback(() => setPlaying((p) => !p), []);

  // Auto-advance. `index` is a dep so manual nav restarts the full interval.
  useEffect(() => {
    if (!isPlaying || count <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), intervalMs);
    return () => clearInterval(id);
  }, [isPlaying, count, intervalMs, index]);

  useEffect(() => {
    if (opts.keyboard === false) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, toggle, opts.keyboard]);

  return { index, isPlaying, toggle, next, prev };
}
