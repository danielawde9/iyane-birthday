# Background music — design

- **Date:** 2026-06-01
- **Status:** Approved (brainstorming) — pending spec review
- **Topic:** Replace the synthesized ambient pad with a real, license-clear background track, played site-wide.

## Context

The site currently has a floating gold "music" toggle (`src/components/site/MusicToggle.tsx`) that synthesizes an ambient pad with the Web Audio API — there is **no real audio file**. It is mounted per-layout in `(site)/(current)/layout.tsx` and `(site)/(archive-year)/archive/[year]/layout.tsx` only.

Gaps with the current state:

- The synth pad is a placeholder, not "proper" music.
- The **centerpiece** experiences — the chrome-less home `LivingGallery` (`src/app/page.tsx`) and `/slideshow` — have **no** music at all.
- Because the toggle is mounted per-layout, playback **restarts on every navigation** between pages.

## Goals

- Ship a real, produced, **1920s parlor-piano** track that matches the "Mr. ONEderful" Art-Deco letterpress theme.
- Use a **license-clear** source (prefer CC0; CC-BY acceptable with a small credit line). Sourced and added as part of this work.
- Play **site-wide** — home, `/slideshow`, and all inner `(site)` pages — from a **single persistent player** that does not restart on navigation.
- **Default OFF**, tap-to-start (never autoplay sound). Remember the user's on/off choice across visits.
- Retire the synth-pad implementation.

## Non-goals

- No autoplay with sound on first load (browser policy + UX choice).
- No per-page / per-photo music, playlists, or track switching UI.
- No streaming from Supabase Storage or a CDN (single static asset in `public/` is sufficient — revisit only if track-swapping-without-deploy becomes a need).
- No music-reactive visuals.

## Decisions (from brainstorming)

| Question | Decision |
| --- | --- |
| Vibe | 1920s parlor piano (soft solo piano / light ragtime-jazz), loop-friendly |
| Sourcing | Claude sources a license-clear track (prefer CC0; CC-BY → add footer credit) |
| Architecture | Approach A — persistent site-wide player mounted once at root |
| Scope | Everywhere (home + slideshow + inner pages) |
| Default state | Try to start ON automatically; if the browser blocks audible autoplay, fall back to OFF + start on first user interaction. An explicit user "off" choice is always honored. Remembers choice in `localStorage`. |
| Synth pad | Removed (optionally kept as a silent fallback only if the file fails to load) |

## Architecture

A single audio element, owned by a client provider mounted **once** in the root layout, controlled from a global toggle button.

```
src/app/layout.tsx (root, server)
└── <MusicPlayerProvider>            (client; owns the single <audio loop>)
      ├── {children}                 (home, /slideshow, all (site) pages)
      └── <MusicToggle />            (client; consumes provider via context)
```

Mounting in the **root** layout (not the `(site)` layouts) is what makes playback persist across navigation and reach the chrome-less home/slideshow routes, since those render under the root layout but outside the `(site)` route group.

### Components / interfaces

- **`MusicPlayerProvider`** (`src/components/site/MusicPlayerProvider.tsx`, `"use client"`)
  - Owns one `<audio loop preload="auto">` pointing at the track in `public/audio/`.
  - Holds state: `isPlaying`, `isReady`/`hasError`.
  - Exposes context: `{ isPlaying, toggle(), play(), pause() }`.
  - On mount: reads `localStorage["iyane.music"]` for last preference. If the user previously turned it **off**, stay off. Otherwise (first visit or saved "on") **attempt to autoplay**: call `play()`; if the browser allows it, reflect "on"; if it rejects (autoplay blocked), fall back to "off" and arm a one-shot `pointerdown`/`keydown`/`scroll` listener to start on the first interaction.
  - Volume default `0.35`; short linear fade in/out (~0.6s) on play/pause to avoid clicks.
  - Writes preference to `localStorage` on toggle.
- **`MusicToggle`** (existing file, rewritten) — same gold pill button + play/pause icons, but stateless: it calls `useMusicPlayer().toggle()` and reflects `isPlaying`. Restyled so it is legible on both the parchment chrome and the dark full-bleed wall (e.g., translucent backdrop that works on either). Stays `fixed bottom-5 right-5 z-50`.
- Remove `<MusicToggle />` from the two `(site)` layouts (the provider + toggle now live at root).

### Data flow

1. Root layout renders `MusicPlayerProvider` wrapping all routes.
2. Provider creates the `<audio>` element (hidden) and reads saved preference.
3. User taps the toggle → `toggle()` → `play()`/`pause()` with fade → state + `localStorage` updated.
4. Navigation between routes does not unmount the provider, so audio keeps playing.

## Sourcing & licensing

- Find a 1920s solo-piano / light ragtime track, ~2–4 min, that loops acceptably.
- **Prefer CC0** (e.g., public-domain / CC0 collections) so **no attribution** is required.
- If the best fit is **CC-BY**, add a small credit line in the site footer (`SiteFooter`) and record the source + license in this repo (e.g., `public/audio/CREDITS.md`).
- Record the chosen track's title, author, source URL, and license in `public/audio/CREDITS.md` regardless, so provenance is clear.
- File stored at `public/audio/<slug>.mp3` (MP3 for universal support). The user can replace this file later with their own track without code changes.

## Autoplay & browser policy

- Preferred behavior is **on by default**: attempt to autoplay on load so the music greets visitors when allowed.
- Browsers often block audible autoplay until a user gesture. When `play()` is rejected, fall back gracefully to "off" and arm a one-shot `pointerdown`/`keydown`/`scroll` listener to start on the first interaction (policy-compliant), then remove it.
- An explicit user "off" (saved in `localStorage`) is always honored — we never re-autoplay over it.
- Accessibility note: because audio may begin without a click where the browser permits, the toggle is always visible so the user can silence it immediately, and the preference persists.

## Accessibility

- Toggle keeps `aria-label` (Play/Pause background music) and `aria-pressed`.
- Keyboard operable (it's a `<button>`).
- Audio may auto-start where the browser allows; the toggle is always visible and reachable so the user can silence it in one tap, and the "off" choice is remembered.

## Error handling

- If the audio file fails to load or `play()` rejects (e.g., blocked), the provider sets `hasError`/keeps `isPlaying=false`; the toggle simply shows the "off" state. No crash, no console spam.
- Optional: if the file 404s, fall back to the existing synth pad (kept as a small helper) — decide during implementation; default is to drop the synth.

## Testing

- **Unit (vitest):** toggle state machine + `localStorage` persistence logic, extracted into a small pure helper/hook so it's testable without real audio.
- **Manual:** browser smoke — start/stop, persistence across reload, playback continuing across navigation (home → gallery → slideshow), legibility of the toggle on dark vs parchment.
- Actual sound output is verified manually (not unit-testable).

## Files

- **Add:** `public/audio/<slug>.mp3`, `public/audio/CREDITS.md`
- **Add:** `src/components/site/MusicPlayerProvider.tsx`
- **Edit:** `src/components/site/MusicToggle.tsx` (rewrite to consume provider)
- **Edit:** `src/app/layout.tsx` (mount provider + toggle)
- **Edit:** `src/app/(site)/(current)/layout.tsx`, `src/app/(site)/(archive-year)/archive/[year]/layout.tsx` (remove the now-duplicate `<MusicToggle />`)
- **Edit (maybe):** `src/components/site/SiteFooter.tsx` (credit line, only if CC-BY)

## Risks / notes

- **Next.js specifics:** per `AGENTS.md`, this is a customized Next.js — check `node_modules/next/dist/docs/` before wiring the root-layout client provider (Server vs Client component boundaries, metadata, etc.).
- **Loop seam:** not every track loops seamlessly; pick one that does, or accept a brief gap. A crossfade loop is out of scope.
- **Mobile:** iOS Safari is strict about audio; tap-to-start covers it. Verify on mobile during manual smoke.
- **Bundle/size:** an MP3 in `public/` is served statically; keep it reasonably small (target < ~4–5 MB) for fast first play.
