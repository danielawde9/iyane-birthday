# Background Music Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the synthesized ambient pad with a real, license-clear 1920s parlor-piano track that plays site-wide from a single persistent player, controllable from the existing gold toggle.

**Architecture:** A `'use client'` `MusicPlayerProvider` is mounted once in the async Server-Component root layout (`src/app/layout.tsx`), wrapping all routes. It owns one `<audio loop>` element and exposes `{ isPlaying, toggle }` via React context. Because it lives at the root (not per-`(site)`-layout), playback persists across navigation and reaches the chrome-less home + `/slideshow`. The toggle button consumes the context. Autoplay is attempted on load and falls back to first-interaction start when the browser blocks it; an explicit "off" is remembered in `localStorage`.

**Tech Stack:** Next.js 16 (App Router, Turbopack), React client components, Web Audio via the native `<audio>` element, vitest (node env), Tailwind. Storage logic uses dependency injection (mirrors `src/lib/uploader-name.ts`).

**Git convention:** Per project convention, **Daniel manages all commits — do NOT auto-commit or push.** The "Checkpoint" at the end of each task marks a logical commit point for him.

**Pre-req for any code task:** This is a customized Next.js 16. The relevant bundled docs were already reviewed: `public/` files serve from `/` (so `public/audio/x.mp3` → `/audio/x.mp3`); `'use client'` marks the client boundary; a client provider may wrap `{children}` inside the async root layout and receive a serializable `string` prop.

---

## File Structure

- **Create** `src/lib/music-prefs.ts` — pure, SSR-safe localStorage helpers + the autoplay decision. One responsibility: persistence/decision logic. Testable without a DOM.
- **Create** `src/lib/music-prefs.test.ts` — vitest unit tests for the above.
- **Create** `src/components/site/MusicPlayerProvider.tsx` — `'use client'` context provider owning the single `<audio>` element, play/pause with fade, autoplay-or-fallback logic.
- **Modify** `src/components/site/MusicToggle.tsx` — rewrite from the self-contained synth to a stateless consumer of `useMusicPlayer()`. (Removes all Web Audio synth code.)
- **Modify** `src/app/layout.tsx` — mount `<MusicPlayerProvider>` + `<MusicToggle/>` inside `<body>`.
- **Modify** `src/app/(site)/(current)/layout.tsx` — remove the now-duplicate `<MusicToggle/>` (import + usage).
- **Modify** `src/app/(site)/(archive-year)/archive/[year]/layout.tsx` — remove the now-duplicate `<MusicToggle/>` (import + usage).
- **Create** `public/audio/grand-jubilee.mp3` — the sourced track.
- **Create** `public/audio/CREDITS.md` — track provenance + license.

---

## Task 1: Music preference + autoplay-decision logic (pure, TDD)

**Files:**
- Create: `src/lib/music-prefs.ts`
- Test: `src/lib/music-prefs.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/music-prefs.test.ts
import { describe, it, expect } from "vitest";
import { loadMusicPref, saveMusicPref, shouldAutoplayOnLoad, MUSIC_PREF_KEY } from "./music-prefs";

function fakeStorage(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, v),
  };
}

describe("music prefs", () => {
  it("returns null when nothing is saved", () => {
    expect(loadMusicPref(fakeStorage())).toBeNull();
  });

  it("loads a saved 'on' or 'off'", () => {
    expect(loadMusicPref(fakeStorage({ [MUSIC_PREF_KEY]: "on" }))).toBe("on");
    expect(loadMusicPref(fakeStorage({ [MUSIC_PREF_KEY]: "off" }))).toBe("off");
  });

  it("treats junk values as no preference", () => {
    expect(loadMusicPref(fakeStorage({ [MUSIC_PREF_KEY]: "maybe" }))).toBeNull();
  });

  it("saves a preference and reloads it", () => {
    const s = fakeStorage();
    saveMusicPref(s, "off");
    expect(loadMusicPref(s)).toBe("off");
  });

  it("autoplays on first visit (null) and when 'on', but not when 'off'", () => {
    expect(shouldAutoplayOnLoad(null)).toBe(true);
    expect(shouldAutoplayOnLoad("on")).toBe(true);
    expect(shouldAutoplayOnLoad("off")).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/music-prefs.test.ts`
Expected: FAIL — cannot resolve `./music-prefs` (module not found).

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/music-prefs.ts
export const MUSIC_PREF_KEY = "iyane.music";

type Readable = Pick<Storage, "getItem">;
type Writable = Pick<Storage, "setItem">;

/** null = no saved preference yet. */
export type MusicPref = "on" | "off" | null;

/** SSR/private-mode safe; never throws. */
export function loadMusicPref(storage: Readable): MusicPref {
  try {
    const v = storage.getItem(MUSIC_PREF_KEY);
    return v === "on" || v === "off" ? v : null;
  } catch {
    return null;
  }
}

export function saveMusicPref(storage: Writable, pref: "on" | "off"): void {
  try {
    storage.setItem(MUSIC_PREF_KEY, pref);
  } catch {
    /* ignore disabled/full storage */
  }
}

/**
 * Attempt autoplay on load unless the user explicitly turned music off.
 * First visit (null) and a saved "on" both opt in; only "off" stays silent.
 */
export function shouldAutoplayOnLoad(pref: MusicPref): boolean {
  return pref !== "off";
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/music-prefs.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Checkpoint** — `src/lib/music-prefs.ts` + test added and green. (Daniel commits.)

---

## Task 2: MusicPlayerProvider (client component)

**Files:**
- Create: `src/components/site/MusicPlayerProvider.tsx`

This component is browser-only (audio + listeners), so it is verified by typecheck + the manual smoke in Task 6, not a unit test. The pure logic it depends on is already tested in Task 1.

- [ ] **Step 1: Create the provider**

```tsx
// src/components/site/MusicPlayerProvider.tsx
"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { loadMusicPref, saveMusicPref, shouldAutoplayOnLoad } from "@/lib/music-prefs";

const TARGET_VOLUME = 0.35;
const FADE_MS = 600;

type MusicContextValue = { isPlaying: boolean; toggle: () => void };
const MusicContext = createContext<MusicContextValue | null>(null);

export function useMusicPlayer(): MusicContextValue {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error("useMusicPlayer must be used within MusicPlayerProvider");
  return ctx;
}

/** Linear volume ramp to avoid clicks on start/stop. */
function fade(audio: HTMLAudioElement, to: number, ms: number, done?: () => void) {
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
}

export function MusicPlayerProvider({ src, children }: { src: string; children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  /** Start playback with a fade-in. `onBlocked` fires if the browser rejects play(). */
  function startPlayback(onBlocked?: () => void) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0;
    audio
      .play()
      .then(() => {
        setIsPlaying(true);
        fade(audio, TARGET_VOLUME, FADE_MS);
      })
      .catch(() => {
        setIsPlaying(false);
        onBlocked?.();
      });
  }

  function stopPlayback() {
    const audio = audioRef.current;
    if (!audio) return;
    fade(audio, 0, FADE_MS, () => audio.pause());
    setIsPlaying(false);
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

  // On mount: try to autoplay unless the user previously chose "off".
  // If the browser blocks audible autoplay, start on the first interaction.
  useEffect(() => {
    if (!shouldAutoplayOnLoad(loadMusicPref(window.localStorage))) return;

    const armResumeOnInteraction = () => {
      const resume = () => {
        window.removeEventListener("pointerdown", resume);
        window.removeEventListener("keydown", resume);
        window.removeEventListener("scroll", resume);
        startPlayback();
      };
      window.addEventListener("pointerdown", resume);
      window.addEventListener("keydown", resume);
      window.addEventListener("scroll", resume);
    };

    startPlayback(armResumeOnInteraction);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <MusicContext.Provider value={{ isPlaying, toggle }}>
      <audio ref={audioRef} src={src} loop preload="auto" aria-hidden="true" />
      {children}
    </MusicContext.Provider>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS (no errors). The provider isn't imported anywhere yet, but it must compile standalone.

- [ ] **Step 3: Checkpoint** — provider compiles. (Daniel commits.)

---

## Task 3: Rewrite MusicToggle to consume the provider

**Files:**
- Modify: `src/components/site/MusicToggle.tsx` (full replace)

Reuses the existing gold-pill styling + play/pause SVGs (legible on parchment and the dark full-bleed wall via the translucent `bg-bg/85` pill); only the state source changes from the local synth to the shared context.

- [ ] **Step 1: Replace the file contents**

```tsx
// src/components/site/MusicToggle.tsx
"use client";

import { useMusicPlayer } from "./MusicPlayerProvider";

export function MusicToggle() {
  const { isPlaying, toggle } = useMusicPlayer();

  return (
    <button
      onClick={toggle}
      aria-label={isPlaying ? "Pause background music" : "Play background music"}
      aria-pressed={isPlaying}
      className="fixed bottom-5 right-5 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-accent/50 bg-bg/85 text-gold-deep shadow-[0_6px_18px_rgba(14,34,64,0.16)] backdrop-blur transition hover:border-accent hover:text-accent"
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
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: FAIL — `(site)` layouts still render `<MusicToggle/>` outside any provider (allowed to compile), but more importantly there are now two import sites. Actually `tsc` will PASS here (types are fine). Proceed; the provider wiring happens in Task 4.

Run again to confirm: `npx tsc --noEmit` → Expected: PASS.

- [ ] **Step 3: Checkpoint** — toggle is now a context consumer; synth code removed. (Daniel commits.)

---

## Task 4: Mount the provider at the root; remove duplicate toggles

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/(site)/(current)/layout.tsx`
- Modify: `src/app/(site)/(archive-year)/archive/[year]/layout.tsx`

- [ ] **Step 1: Add imports to the root layout**

In `src/app/layout.tsx`, after the existing imports (e.g., after `import { themeToCssVars } from "@/themes";`), add:

```tsx
import { MusicPlayerProvider } from "@/components/site/MusicPlayerProvider";
import { MusicToggle } from "@/components/site/MusicToggle";
```

- [ ] **Step 2: Wrap the body children with the provider + toggle**

In `src/app/layout.tsx`, replace:

```tsx
      <body className="min-h-full flex flex-col">{children}</body>
```

with:

```tsx
      <body className="min-h-full flex flex-col">
        <MusicPlayerProvider src="/audio/grand-jubilee.mp3">
          {children}
          <MusicToggle />
        </MusicPlayerProvider>
      </body>
```

- [ ] **Step 3: Remove the toggle from the `(current)` layout**

In `src/app/(site)/(current)/layout.tsx`:
- Delete the import line `import { MusicToggle } from "@/components/site/MusicToggle";`
- Delete the `<MusicToggle />` line from the returned JSX.

- [ ] **Step 4: Remove the toggle from the archive-year layout**

In `src/app/(site)/(archive-year)/archive/[year]/layout.tsx`:
- Delete the import line `import { MusicToggle } from "@/components/site/MusicToggle";`
- Delete the `<MusicToggle />` line from the returned JSX.

- [ ] **Step 5: Typecheck + build**

Run: `npx tsc --noEmit`
Expected: PASS.

Run: `npm run build`
Expected: build succeeds (the audio file may not exist yet — that's fine; the `<audio src>` is just a string and is not validated at build time).

- [ ] **Step 6: Checkpoint** — single root-level player wired; per-layout toggles removed. (Daniel commits.)

---

## Task 5: Source and add the track

**Files:**
- Create: `public/audio/grand-jubilee.mp3`
- Create: `public/audio/CREDITS.md`

**Acceptance criteria for the track:** instrumental **1920s parlor / ragtime solo piano**; roughly **2–4 minutes**; loops acceptably (low/quiet ending or steady texture, no abrupt cut-off); license is **CC0 / public domain** (preferred — no attribution) or **CC-BY** (acceptable — requires a credit line). MP3, ideally < ~5 MB.

- [ ] **Step 1: Find a license-clear track**

Use WebSearch/WebFetch to locate a candidate on a source whose license page is verifiable, e.g.:
- A CC0 / royalty-free ragtime-piano track on Pixabay Music or Free Music Archive, **or**
- A public-domain 1920s ragtime piano recording on the Internet Archive (pre-1923 US recordings are public domain).

Open the source page and **confirm the license explicitly** (CC0, public domain, or CC-BY). Record: title, author/performer, source URL, license.

- [ ] **Step 2: Download to the public folder**

```bash
mkdir -p public/audio
curl -L -o public/audio/grand-jubilee.mp3 "<VERIFIED_DIRECT_MP3_URL>"
```

- [ ] **Step 3: Verify it is a valid audio file of sane size/length**

```bash
file public/audio/grand-jubilee.mp3        # expect: "Audio file ... MPEG ... layer III"
ls -lh public/audio/grand-jubilee.mp3      # expect: a few hundred KB – ~5 MB
# duration (ffprobe if available; otherwise skip):
command -v ffprobe >/dev/null && ffprobe -v error -show_entries format=duration -of csv=p=0 public/audio/grand-jubilee.mp3
```
Expected: a valid MPEG layer III audio file, ~2–4 min. If the file is HTML/an error page or 0 bytes, the URL was wrong — return to Step 1.

- [ ] **Step 4: Record provenance**

```markdown
<!-- public/audio/CREDITS.md -->
# Audio credits

- **File:** `grand-jubilee.mp3` (site background music)
- **Title:** <track title>
- **Artist / performer:** <name>
- **Source:** <URL>
- **License:** <CC0 / Public Domain / CC-BY 4.0>
- **Attribution required:** <no | yes — credit shown in SiteFooter>
```

- [ ] **Step 5: If (and only if) the license is CC-BY**, add a one-line credit in `src/components/site/SiteFooter.tsx`

Read `src/components/site/SiteFooter.tsx` first to match its existing markup, then add a small muted line such as:

```tsx
<p className="...existing footer text classes...">
  Music: “<title>” by <artist> (CC BY 4.0)
</p>
```

Skip this step entirely for CC0 / public-domain tracks.

- [ ] **Step 6: Checkpoint** — track + CREDITS added. (Daniel commits.)

---

## Task 6: Full verification

**Files:** none (verification only).

- [ ] **Step 1: Unit tests + typecheck + build**

```bash
npm run test
npx tsc --noEmit
npm run build
```
Expected: all green; `music-prefs` tests pass; build succeeds.

- [ ] **Step 2: Manual browser smoke**

Start the dev server (a dev server for this repo may already be running — Next 16 allows only one; reuse its port). Then verify in a browser:
1. Load the home page (`/`). With a fresh profile (no `iyane.music` key), music **attempts to start**; where the browser blocks autoplay, it starts on the **first click/scroll**. The gold toggle shows the "playing" (pause) icon once audio is running.
2. Click the toggle → music fades out and stops; icon flips to "play".
3. Navigate `/` → `/gallery` → `/slideshow`. Playback **continues without restarting** across navigation.
4. Reload after turning it **off** → it stays **off** (preference remembered).
5. The toggle is legible bottom-right on both the dark full-bleed home/slideshow and the parchment inner pages.

- [ ] **Step 3: Confirm the asset serves**

```bash
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://localhost:<port>/audio/grand-jubilee.mp3
```
Expected: `200 audio/mpeg` (or `audio/mp4`-style for the chosen container).

- [ ] **Step 4: Checkpoint** — feature verified end to end. (Daniel commits / deploys.)

---

## Self-Review notes (author)

- **Spec coverage:** real 1920s-piano track (Task 5) ✓; site-wide persistent player at root (Tasks 2,4) ✓; autoplay-when-allowed + first-interaction fallback + remembered "off" (Tasks 1,2) ✓; toggle restyled/global (Tasks 3,4) ✓; synth removed (Task 3) ✓; CC0-preferred + CC-BY credit path (Task 5) ✓; tests for prefs/decision (Task 1) ✓; manual smoke (Task 6) ✓.
- **Type consistency:** `MusicPref`, `loadMusicPref`, `saveMusicPref`, `shouldAutoplayOnLoad`, `MUSIC_PREF_KEY` used identically across `music-prefs.ts`, its test, and the provider. Context value `{ isPlaying, toggle }` consumed unchanged by `MusicToggle`. Asset path `/audio/grand-jubilee.mp3` matches the `<MusicPlayerProvider src>` prop and the Task 5 filename.
- **Placeholders:** the only intentionally-deferred value is the verified track URL in Task 5 Step 2 (`<VERIFIED_DIRECT_MP3_URL>`), which is a research-and-verify step with explicit acceptance criteria, not a hand-wave.
