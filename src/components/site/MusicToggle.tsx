"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A subtle, muted-by-default ambient pad synthesized with the Web Audio API —
 * no audio file to ship, and it only starts on a user tap (respecting autoplay
 * policies). A soft major chord with a slow tremolo.
 */
export function MusicToggle() {
  const [on, setOn] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode[]>([]);
  const masterRef = useRef<GainNode | null>(null);

  function start() {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    const freqs = [220, 277.18, 329.63, 440]; // A major-ish pad
    const oscs = freqs.map((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = i % 2 === 0 ? "triangle" : "sine";
      osc.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = 0.16 / (i + 1);
      osc.connect(g);
      g.connect(master);
      osc.start();
      return osc;
    });

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.12;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.03;
    lfo.connect(lfoGain);
    lfoGain.connect(master.gain);
    lfo.start();
    oscs.push(lfo);

    master.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 1.5);
    ctxRef.current = ctx;
    oscRef.current = oscs;
    masterRef.current = master;
  }

  function stop() {
    const ctx = ctxRef.current;
    const master = masterRef.current;
    const oscs = oscRef.current;
    if (ctx && master) {
      master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.7);
      window.setTimeout(() => {
        oscs.forEach((o) => {
          try {
            o.stop();
          } catch {
            /* already stopped */
          }
        });
        void ctx.close();
      }, 800);
    }
    ctxRef.current = null;
    oscRef.current = [];
    masterRef.current = null;
  }

  function toggle() {
    if (on) {
      stop();
      setOn(false);
    } else {
      start();
      setOn(true);
    }
  }

  useEffect(() => () => stop(), []);

  return (
    <button
      onClick={toggle}
      aria-label={on ? "Pause background music" : "Play background music"}
      aria-pressed={on}
      className="fixed bottom-5 right-5 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-accent/50 bg-bg/85 text-gold-deep shadow-[0_6px_18px_rgba(14,34,64,0.16)] backdrop-blur transition hover:border-accent hover:text-accent"
    >
      {on ? (
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
