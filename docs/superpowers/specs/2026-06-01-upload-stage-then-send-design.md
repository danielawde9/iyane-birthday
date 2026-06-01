# Upload: stage-then-send, remembered uploader, mobile-first order

**Date:** 2026-06-01
**Component:** `src/components/upload/Uploader.tsx` (+ minor copy)
**Status:** SUPERSEDED — see revision below.

---

## ⚠️ Revision (2026-06-01, same day): pivoted to instant-upload, name-first

Stage-then-send shipped and was UI-tested, but on review it felt like bad UX: nothing
uploaded until an explicit **Send** tap, the name sat in a side form, and on mobile the
Send button was separated from the staged photos. A scan of comparable no-app QR guest-photo
products (GUESTPIX, GuestCam, Fotify, Kululu, Wedibox) showed the universal pattern is:
**enter your name first (optional), then picking a photo uploads it immediately — no Send step.**

The component was reworked to match:
- **Name first**, at the top — remembered across visits as an "Adding as {name} ✕" chip
  (✕ clears it). Optional, prompted (Fotify-style).
- **Picking/dropping photos uploads them instantly** (compress → POST, ~3 concurrent), each
  tile showing Optimising… → Adding… → ★ Added. **No Send button.**
- Single centered column (name → drop zone → "your photographs" grid → phone QR), so the
  order is right on mobile and desktop alike.
- **No uploader-side delete** in this version — failed tiles can be dismissed locally, but a
  successfully uploaded photo is removed via `/admin` moderation (guest-delete would need
  per-photo ownership; deferred).
- Compression unchanged (1600px / 1.6 MB / q0.82). `uploader_name` still attaches at upload
  time, so no DB migration and no backfill endpoint.

Verified end-to-end against a real local Supabase DB on desktop (1280px) and mobile (iPhone 13):
picking auto-uploads (HTTP 200, no Send), names persist to the right rows, dimensions correct.

The sections below describe the original (now-replaced) stage-then-send design, kept for history.

---

## Problem

The photo uploader has three rough edges:

1. **Mobile order is misleading.** The layout stacks drop-zone → staged grid → name/caption, but the copy says *"Fill these in first"* (`Uploader.tsx:284`). The name field is physically below the upload, so nobody signs first.
2. **No memory of the uploader.** The name lives in React state only (`Uploader.tsx:63`); it survives one page session but is wiped on reload. A guest who returns tomorrow re-types their name. Nothing keys uploads to a person.
3. **No way to remove a wrong photo.** Uploads fire instantly on drop (`Uploader.tsx:105-139`); a blurry/duplicate/accidental shot is already stored with no undo in the UI.

## Decisions (locked with the user)

- **Name attaches via "stage, then send."** Dropping photos compresses + previews them locally; nothing uploads until an explicit **Send** tap. The name rides along at send time exactly like today's `uploaderName` form field — so **no DB migration**, `uploader_name` column untouched.
- **Send is always an explicit tap**, even for a remembered guest (prevents accidental uploads; lets them remove a bad shot first).
- **Photo quality is unchanged** — keep 1600px / 1.6 MB / q0.82. Originals stay discarded. (User is size-conscious; this was the whole "no 6 MB" concern.)
- **Skipped for now:** the `/api/upload` rate-limit change and the friendlier HEIC-failure handling. Recorded as known limitations below.

## Goals

- Upload-first flow that lets the name be added before sending, with the order matching the copy on mobile.
- Remember the uploader on the device so returning guests don't re-type their name, with an obvious escape hatch for a shared phone.
- Let a guest discard a staged photo before it ever uploads.

## Non-goals

- Changing compression/quality or keeping originals.
- Per-photo captions (caption stays per-send, applied to all photos in that send).
- Any change to PIN gating, server magic-byte validation, the 15 MB server cap, or the `photos` schema.
- Cross-device identity — memory is `localStorage`, device-local only.

## Design

### 1. Stage, then send

`handleFiles` no longer uploads. It becomes:

- For each picked/dropped file: create a staged `Item`, run `prepareImage()` (HEIC→JPEG + compress full + thumb, unchanged), and store the resulting `full`/`thumb` blobs + dims **on the item** in state (currently they're computed then immediately POSTed and discarded).
- Item status set: `processing` → `ready` (new) instead of `processing → uploading → done`.
- A new **Send** action iterates the `ready` items and POSTs each to `/api/upload` (same FormData shape: `image`, `thumb`, `width`, `height`, `uploaderName`, `caption`), running **~3 in parallel** (small concurrency pool) instead of the current one-at-a-time `for await`.
- Per-item status during send: `ready → uploading → done | error`. `done` items can be cleared from the staged grid; the existing "{n} photographs placed" confirmation + gallery link stays.

`Item` type gains: `full: File`, `thumb: File`, `width`, `height`, and a `ready` status. The object URL `preview` is still used for the thumbnail and must be `revokeObjectURL`'d when an item is removed or after send to avoid leaks.

### 2. Remembered uploader + clear

- On a successful send, write the trimmed name to `localStorage` (e.g. key `iyane_uploader_name`).
- On mount, read it into the `name` state.
- When a name is present, render it as a compact **"Adding as {name} ✕"** chip. The ✕ clears `localStorage` + resets `name` to empty, reverting to the editable input. This handles a shared phone / "not me."
- When no name is present, show the editable **"Your name (optional)"** input as today.

### 3. Layout / order

- **Desktop (`lg`):** unchanged two-column shape — staged grid + Send on the left, name/note chip + QR on the right.
- **Mobile:** the name/note + Send controls render **above** the staged grid (CSS `order` / restructure), so the flow is drop-zone → sign → grid. This is the fix for problem #1.
- Reword the *"Fill these in first…"* line (`Uploader.tsx:284`) to reflect upload-first (e.g. "Your name signs every photo in this batch — add it before you send.").

### 4. Remove a staged photo

- Each staged tile (`Uploader.tsx:218-249`) gains a small **✕** that removes the item from state and revokes its object URL — only meaningful while `ready` (before send). This fixes problem #3 for free under the new flow.

## Data model

No change. Name still lands in `photos.uploader_name` (nullable) at send time via the existing `/api/upload` route and `insertPhoto()`. No migration.

## Known limitations (accepted for now)

- **Rate limit unchanged.** `/api/upload` allows 12 uploads/min per IP. With stage-then-send + ~3 parallel uploads, a guest sending more than ~12 photos in a minute will get `429`s on the overflow — and slightly more readily than the old sequential flow. Future option (client-only, no server change): detect `429` and retry that tile with backoff so the batch self-paces.
- **HEIC failures** still surface as a generic error item rather than a friendly "couldn't read this one — remove?" prompt.

## Files in scope

- `src/components/upload/Uploader.tsx` — the bulk of the change (staging state, Send action + concurrency pool, name chip + `localStorage`, remove ✕, mobile order, copy).
- No API, DB, or schema files change.

## Testing approach

- Drop several photos → confirm they preview as "ready" and nothing has uploaded (no network POST yet).
- Remove a staged photo via ✕ → item gone, no upload.
- Enter a name, tap Send → photos upload with `uploader_name` set; "{n} placed" + gallery link appears.
- Reload the page → name is pre-filled and shown as "Adding as {name} ✕".
- Tap the chip ✕ → name cleared, editable input returns, `localStorage` key removed.
- Mobile viewport → name/note/Send render above the staged grid.
- Send a large batch (>12) → document that overflow currently 429s (known limitation).
