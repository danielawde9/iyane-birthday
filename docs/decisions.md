# Decisions ledger

Append-only. Every assumption made in the client's absence and every deviation from the
brief gets an entry: what was decided, why, and **what changes if the client answers
differently**. Surface this at UAT.

---

## 2026-08-07 — Watercolor circus redesign

Context: the site wore "The Grand Jubilee", a hard-edged letterpress system. The invitation
guests actually received is a 29-second watercolor film in four scenes. The site was
redesigned to match the film.

### D-001 · The film is the source of truth for the design

**Decided.** Palette, typography, motifs, and event copy are all taken from the client's
invitation film (`WhatsApp Video 2026-08-05 at 15.30.08.mp4`), not invented. Hexes are
sampled from it: `#A3322E` red, `#596C90` blue, `#D5A76A` gold.

**Why.** Guests have already seen the film. A site that looks like a different party is a
worse outcome than a site that looks slightly less polished.

**If the client answers differently:** if they want a fresh look rather than a matching one,
`src/themes/big-top.ts` is the single place the palette and fonts live.

### D-002 · Artwork is AI-generated, conditioned on the client's own film

**Decided.** The film is 480×848 — too soft for a desktop hero. Reference stills were pulled
with `ffmpeg` and used as `image2image` style references (OpenArt, `nano-banana-pro`) to
generate the assets at 2K. `tent.webp` was generated first and used as the style anchor for
the rest. Full provenance and prompts: `public/art/CREDITS.md`.

**Why.** It keeps one artist's hand across nine assets while supplying the resolution the
film can't.

**If the client answers differently:** if they'd rather commission the original illustrator,
every asset is a single file in `public/art/` and can be swapped without touching code — with
one exception, noted in D-006.

**Known limit:** `bunting` and `parchment` are `text2image`, not reference-conditioned.
Passing the tent as a reference made the model paint the tent *into* the result. Flat, simple
subjects were more reliable described in words.

### D-003 · Real alpha, not `mix-blend-mode: multiply`

**Decided.** All painted art ships as alpha WebP. The original plan was white-backed PNGs
composited with `multiply`.

**Why.** `multiply` composites against the nearest stacking context, so any ancestor with a
transform, filter, opacity, or z-index silently traps the blend and the white box reappears —
and it can never sit over a photograph or a dark panel without turning to mud. Alpha has none
of those constraints, works in print, and survives `forced-colors`. ImageMagick corner
flood-fill removes only the *contiguous outside* white, preserving cream washes enclosed
inside the artwork.

**If the client answers differently:** n/a — this is a technical decision, not a taste one.

### D-004 · Re-skinned `big-top` in place rather than adding a new theme slug

**Decided.** The plan called for a new `watercolor-circus` theme module. Instead
`src/themes/big-top.ts` was rewritten, keeping the slug.

**Why.** The active event row resolves through `big-top` (and the `mr-onederful` alias). A new
slug would have left the live site on the old letterpress look until someone changed a
database field. Re-skinning in place needs no migration.

**If the client answers differently:** if they ever want both looks selectable, split the
watercolor palette into a new module and register it; the `--v-*` variant seam already
supports it.

### D-005 · No new palette token for the film's blue

**Decided.** The plan proposed adding `accentCool` to `ThemePalette`. Instead the existing
`joy` key carries the dusty azure.

**Why.** `joy` is used in exactly two places (the live-pulse dot and fresh-badge accents), the
blue is mostly carried by the artwork rather than by CSS, and adding a 16th key would have
forced an edit to all three theme modules and the type for very little gain.

**If the client answers differently:** if blue becomes a real UI color, add the key then —
TypeScript will point at every site that needs it.

### D-006 · The tent doorway coordinates are measured, not guessed

**Decided.** The `/preview/tent` hero positions the photo using a hard-coded percentage box
(`DOOR` in `HeroTentDoor.tsx`) measured from `tent-open.webp`'s transparent region.

**Why.** Letting the artwork mask itself is far more robust than a CSS `clip-path` arch.

**Trade-off, and the one real caveat on swapping art:** if the tent is ever regenerated, those
percentages **must be re-measured**. Also, the arch is 10.9% × 27% — a narrow portrait slot —
so landscape photographs are cropped hard. The full uncropped rotation still plays below.

### D-007 · Three home heroes were built; the poster won

**Decided.** Three hero compositions were built and reviewed side by side under `/preview`:
the poster, marquee-over-slideshow, and photos-in-the-tent-door. **Daniel chose the poster.**
`/` now renders `HeroPoster`, and the other two components, the `/preview` routes, and the
`tent-open.webp` asset that only the tent-door variant used have all been deleted.

**Why build three and throw two away.** Daniel asked for options rather than a single design,
and `/` was deliberately left on the old hero during the review so the live page could not
break mid-decision. Keeping the losers behind an unused route would have left two untested
compositions to rot.

**If the client answers differently:** the two removed variants are recoverable from git
history; both took the same props as `HeroPoster`, so restoring one is a one-line swap.

### D-008 · Event details corrected to match the invitation

**Decided.** The year-1 event was seeded as **15 July 2026, "Gharfi, Shouf"**. The invitation
says **Saturday 15 August 2026, 4:00 PM, at Teta & Jeddo's House, Gharifeh**. `src/db/demo.ts`
now carries the corrected values.

**⚠ This touches live data, not just code.** `db:seed` deliberately leaves an existing year-1
row alone, so the fix only reaches a *new* database. An existing row needs
`npm run db:sync-event` (supports `--dry`), run deliberately against the target database. It
has been applied to local dev only. **Production has not been touched.**

**If the client answers differently:** if any of these details are wrong, correct
`src/db/demo.ts` and re-run the script.

### D-009 · Gold-on-red is not used for text anywhere

**Decided.** `accent` (`#D5A76A`) on `primary` (`#A3322E`) measures 3.13:1 and fails WCAG AA.
Every red band uses `accentBright` (5.17:1) instead. `accent` on the dark slideshow backdrop
is fine (7.45:1) and is still used there.

**Why.** A believable watercolor ochre is a dark pigment; there is no version of it that also
passes on a madder red. Fixed at the call sites rather than by compromising the palette.

### D-010 · Two pre-existing bugs fixed in passing

Both were invisible before this work and are recorded so they aren't "re-fixed" later:

1. **Theme fonts never reached Tailwind's `font-*` utilities.** `@theme inline` compiles
   utilities with the *resolved* value, so `.font-display` was frozen to Year 1's typeface.
   Fixed by routing through `--th-font-*`.
2. **Nested archive years rendered the root year's typeface.** A custom property is
   substituted on the element that *declares* it, so `--font-*-stack` living only on `:root`
   resolved there and inherited down. Fixed by declaring the stacks in every theme block.

`src/themes/variant-vars.test.ts` is the ratchet for both, plus for the rule that every
`[data-theme]` block declares the full `--v-*` set. It parses `globals.css` and fails the
build on drift.

### D-011 · Out of scope, deliberately

- `src/app/admin/**` keeps its off-system styling (rounded, amber) — it is a private tool, not
  part of the guest-facing identity.
- The film itself does not play anywhere on the site; Daniel chose stills only.
- Scenes 2–4 of the film (ribbons, curtains, ringmaster, animals) were not turned into assets.
  `/details` uses a drawn bunting ornament instead of the film's curtains. Worth revisiting if
  the site wants more of the film's range.

### D-012 · The site header is a painted canopy, with a measured scrim

**Decided.** The nav band was a flat red bar with CSS-drawn triangles. It is now the film's
lit circus canopy: a tiling striped roof behind the nav (`canopy-band.webp`) and a scalloped
valance with bulbs hanging below it (`canopy-valance.webp`), replacing the drawn shapes.

**Why.** It was the last part of the chrome still made of CSS shapes rather than paint, and
the film has exactly this motif at the top of scenes 2 and 4.

**The catch, and the number that matters.** The canopy's cream stripes measure ~1.05:1 against
the cream nav text — completely illegible. So the band carries a red **scrim** gradient over
the artwork: ~32% at the top edge, where it lets the stripes read, thickening to 88–92% where
the labels actually sit. Measured against the artwork's own lightest sampled stripe
(`#FAF0DC`), that lands at **4.7–5.2:1**, i.e. AA. Lowering the scrim to show more stripe
detail will break the header's contrast — check it before changing it.

A flat colour is deliberately NOT used on `.site-marquee` any more, because the valance has
transparent gaps between its scallops and a background colour would show through them as a
hard rectangle. The opaque safety fill is a background *image* sized to stop above the valance.

**If the client answers differently:** if the stripes should be bolder, the honest options are
a darker nav text colour or a solid banner behind the links — not a thinner scrim.

### D-013 · Home, gallery width, wordmark, and the dead-code sweep

Four changes made together once the poster hero was chosen:

- **`/` is the poster hero.** See D-007.
- **The photo wall runs edge to edge.** `PageShell` gained a `full` mode used by `/gallery`
  and `/archive/[year]`. Only the children go full-bleed — the header block stays centred at
  the reading width, because a lead paragraph stretched to 2000px helps nobody. The masonry
  column count now climbs to 4 and 5 at `xl`/`2xl`, so a wide monitor gets *more* photos
  rather than three enormous ones.
- **The wordmark is one word.** It was a rotated, boxed "I" tile followed by "YANE", which
  read as two separate objects rather than a name. It is now a single letterspaced "IYANE",
  and the `--v-mark-border` / `-shadow` / `-rotate` variables that only the tile used are gone.
- **The header caption moved under the wordmark.** Side by side, the brand block and the nav
  competed for horizontal space and the theme name truncated mid-word ("…Little Show on Ear…").
  Stacked, the caption has the brand block's full width.

**Dead code removed in the same pass:** the two losing hero variants and their route folder;
`tent-open.webp`; `BigOne.tsx` and `DecoFrame.tsx` (unreferenced brand marks from the
pre-watercolor identity); the `Marquee` alias and the no-op `BulbRow()`; and the header's
drawn scallop SVG — 68 `<path>` elements that both themes rendered with `display: none` on
every single page — along with the five `--v-*` variables that only it read.

`Reveal.tsx` is unreferenced but was left alone: it is a generic scroll-in utility rather than
an artifact of the old design system, and removing it would strip the `motion` dependency.

### D-014 · The slideshow moved from home to the gallery

**Decided.** The live rotating photo wall no longer sits under the poster on `/`. It now opens
`/gallery`, full-bleed under the header, with the masonry wall beneath it.

**Why.** With the poster hero in place, home had two competing "look at this" moments stacked
on one page, and the slideshow — the thing that actually changes as guests upload — was the one
below the fold. Home is now a single poster whose job is to greet and send you on (its two
buttons go to `/gallery` and `/upload`), and everything photographic lives in one place.

**Consequences worth knowing:**
- `/` loads **no photo data at all** now. `src/lib/home-data.ts` had no callers left and was
  deleted; the gallery builds the slideshow's featured-first list from rows it had already
  fetched, so the page did not gain a single extra query.
- `LivingGallery` lost its `framed` prop. It has exactly one caller, so the switch was dead
  API — it is now unconditionally the gallery's opening band.
- Its height is ~70–78svh rather than a full screen, deliberately: the photo wall should be
  visible the moment you start scrolling, not a whole viewport away.

### D-015 · The gallery lost its duplicated furniture

**Decided.** Two things were stripped from `/gallery`:

- The slideshow now carries **only the photo credit and the transport controls**. The floating
  "Admit One" QR, the crest, the "greatest little show on earth" tagline and the guest count
  are gone.
- The **"A Moment From the Room" featured panel** is gone, along with its dedicated lightbox.

**Why.** Once the slideshow moved onto this page (D-014), the page said everything twice. The
slideshow already leads with the featured photo, so the hero panel underneath repeated it
immediately. The QR duplicated the header's permanent "Add Photos" button and the stats
panel's "Add Yours"; the guest count duplicated "N moments from N guests" a few hundred pixels
below. All of it competed with the photograph, which is the only thing on that page worth
looking at.

**Consequences:**
- The featured photo now appears in the grid like any other, so the de-duplication filter that
  kept it out went too.
- `Gallery` no longer takes a `featured` prop. `/archive/[year]` therefore stopped needing
  `getFeaturedPhoto` at all — that page now runs three queries instead of four.
- `LivingGallery` no longer takes `guestCount`, and renders **nothing** when there are no
  photos rather than showing its own "be the first" prompt: the wall below already has one, and
  two on a page is one too many.

### D-016 · The slideshow stopped covering its own photograph

**Decided.** The slideshow is now a three-row column — header clearance, the photo, then the
credit and transport on the dark ground *below* it — instead of a photo with everything
floating on top of it.

**Why.** Three problems, one cause. The painted valance hangs ~44px below the header, so it was
clipping the top of every photograph. The credit and controls sat over the picture, so both a
vignette and a gradient bar had to darken the photo just to keep them legible. And the controls
were small and low-contrast because anything bolder would have fought the image.

Insetting the photo below the valance and moving the furniture underneath fixes all three at
once: nothing overlaps the picture, so the vignette and the gradient bar are gone entirely, and
the buttons could grow (h-14/h-11, 2px borders) without competing with anything.

**The photo also gained a real drop shadow.** It sits over a blurred, darkened copy of itself,
and without separation the two blurred into each other — the photograph stopped reading as a
photograph. `drop-shadow-[0_12px_44px_rgba(0,0,0,0.62)]` lifts it off its own backdrop.

**Consequence:** `PhotoControls` was split into `PhotoProgress` (pinned to the top of the photo
area) and `PhotoControls` (inline, positioned by the caller). It was one absolutely-positioned
unit before, which is exactly what prevented the buttons from living anywhere but on top of the
image. Both are used only by `LivingGallery`.

---

## 2026-08-07 — Guests can edit and remove their own contributions

### D-017 · Per-row capability tokens, not guest accounts

**Decided.** A guest may edit the text of, or take down, a photo or wish they posted. Authorization
is a **per-row capability token**: on create the server mints 32 random bytes, stores only
`sha256(token)` in `photos.edit_token_hash` / `guestbook.edit_token_hash`, and returns the raw
token in the response body exactly once. The browser keeps it in `localStorage`
(`src/lib/edit-tokens.ts`); it travels back in an `x-edit-token` **header** on PATCH/DELETE, never
in a URL. Comparison is timing-safe (`src/lib/edit-token.ts`), and the rules are one pure function
(`src/lib/edit-authz.ts`) that fails closed.

**Why.** The brief is emphatic that uploads stay anonymous and that the Lebanon geo gate is the
only gate — so accounts were never on the table, and asking sixty relatives to invent a password
would cost more contributions than it protects. A capability token gives exactly the authority
needed (this one row, these two text fields) and no more. A 256-bit token is not guessable, which
matters because `MemoryRateLimiter` is per-instance and is not a real brute-force defence.

**Cost, stated plainly:** the token *is* the identity. Anyone who obtains it can edit that row.
That is the same trade as an unguessable share link, and it is bounded to one row.

**If the client answers differently:** if they ever want real guest identity, the token column
becomes a `guest_id` FK and `authorizeEdit` is the single function that changes.

### D-018 · Removal is a soft delete, and the storage object stays

**Decided.** A guest removing something sets `status = 'removed'`. The row is never deleted and
`removeFromStorage` is never called from a guest route — `src/app/api/photos/[id]/route.test.ts`
asserts both. `status` is now `visible | hidden | removed`, enforced by a CHECK constraint
(migration `0004_late_red_skull.sql`).

**Why.** `'hidden'` (the host moderating) and `'removed'` (a guest changing their mind) are
different events and the host should be able to tell them apart in `/admin`, where both are now
badged and restorable. A mis-tap on a phone at a party should not destroy the only copy of a
photograph — and the host may well want it back.

**A guest cannot edit or undo a row the host has hidden.** That is deliberate: moderation would be
worthless if the moderated party could reverse it. They get a 403 that says to ask the host.

**If the client answers differently:** if they want guest removals to really delete, `softRemovePhoto`
becomes `deletePhoto` + `removeFromStorage` — but then the restore affordance in `/admin` must go
too, and the ledger should say so.

### D-019 · A lost `localStorage` is unrecoverable, by design, and the UI says so

**Decided.** Tokens live only in the browser that created the row. Clear site data, switch phone,
or open the site in a different browser and the Edit/Remove controls simply do not appear. There
is no recovery flow. Every edit surface carries the same sentence (`ThisDeviceNote`): *you can
change this because you posted it from this browser… just ask the host, they can fix anything.*

**Why.** Any recovery mechanism — email a link, "claim your uploads" — is an account system wearing
a hat, and would need to collect contact details from guests who deliberately were not asked for
any. The host's admin page is already a complete escape hatch.

**If the client answers differently:** if guests start asking, the cheapest answer is for the host
to make the change in `/admin`, not to build recovery.

### D-020 · The geo gate applies to edits too

**Decided.** PATCH and DELETE reuse `isUploadGeoAllowed` and `writeLimiter` exactly as the POST
routes do (`src/lib/guest-write.ts`).

**Why.** The brief asked for it, and it keeps one rule rather than two. **The consequence is real:**
a guest who uploaded in Lebanon and then flew home cannot fix their own caption — they get the
`geo_locked` 403. Logged here as a decision rather than discovered later as a bug.

**If the client answers differently:** dropping the geo gate on edit-only routes is a two-line
change in `guardGuestWrite`; the token remains the actual authorization either way.

### D-021 · The token hash is kept out of the anon role by column GRANT, not by RLS

**Decided.** `supabase/policies.sql` now revokes all privileges on `photos` / `guestbook` from
`anon` and grants back an explicit column list that omits `edit_token_hash`. In parallel,
`src/db/queries.ts` stopped using `select("*")` and names its columns via `PHOTO_COLS` /
`GUESTBOOK_COLS` (`src/db/columns.ts`). `PhotoRow` / `GuestbookRow` exclude the hash at the type
level, so it cannot reach a DTO.

**Why.** RLS filters rows, not columns — the existing `status = 'visible'` policies would have
happily served the hash to anyone holding the public anon key, and one `curl` against PostgREST
would have made every photo editable by anyone. The two halves are coupled and must ship together:
Postgres expands `select *` **before** checking column privileges, so applying the GRANT while any
anon read still used `*` would break every public read with *permission denied for column
edit_token_hash*. `src/db/columns.test.ts` guards the column list against regression.

**If the client answers differently:** n/a — this is a correctness constraint, not a preference.

### D-022 · Zod was added for the PATCH bodies only

**Decided.** `zod` is now a dependency and validates the two PATCH bodies (`src/lib/edit-payload.ts`),
as strict objects — sending `status`, `featured` or `edit_token_hash` is a 400, not a silently
stripped no-op. The existing POST routes keep using `sanitizeText`.

**Why.** A guest patch is the first place in this codebase where *which keys are present* is itself
a security question, and an allow-list should say no out loud. Converting the working POST routes
at the same time would have risked live upload paths for no gain. The emitted column object is
still built key-by-key, so the schema is a second gate rather than the only one.

**If the client answers differently:** if they'd rather not carry the dependency, the two parsers
are ~30 lines and can be rewritten on `sanitizeText` without touching anything else.

### D-023 · The home slideshow has no edit controls

**Decided.** `LivingGallery` shows no Edit/Remove affordance. Guests manage their photos on
`/gallery` and their wishes on `/guestbook`.

**Why.** It is a passive full-bleed slideshow that re-polls every 30 seconds and replaces its whole
array; controls there would fight the rotation, and a removal would visibly reappear until the next
poll. Not worth the complexity for a surface nobody reads as an inventory.
