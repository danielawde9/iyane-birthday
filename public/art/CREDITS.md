# Watercolor art assets

All artwork here is derived from the client's own animated invitation film
("WhatsApp Video 2026-08-05 at 15.30.08.mp4", 29s, 480×848). The film is the
source of truth for palette, brushwork, and subject matter — the site is meant
to read as the same artist's hand.

## How these were made

1. Reference stills were extracted from the film with `ffmpeg` (one per scene).
2. `tent.webp` was generated first, using the film's poster scene as an
   **image2image style reference** (OpenArt, `nano-banana-pro`, 2K). The film is
   only 480px wide — too soft for a desktop hero — so the reference fixes the
   style while the generation supplies the resolution.
3. Every other asset was generated against `tent.webp` as the style anchor, so
   the set shares one palette and one brush.
   - Exception: `bunting` and `parchment` are `text2image`. Passing the tent as a
     reference caused the model to treat it as *content* and paint the tent into
     the result; describing the palette in words was more reliable for flat,
     simple subjects.
4. Backgrounds were knocked out to real alpha with ImageMagick, flood-filling
   from all four corners with a 10–12% fuzz. Corner flood-fill (rather than a
   global `-transparent white`) removes only the *contiguous outside* white, so
   the cream washes enclosed inside the artwork survive.
5. Alpha art shipped as WebP (quality 84, alpha-quality 95); the parchment tile
   as JPEG. Total budget: under 500 KB.

**Why alpha and not `mix-blend-mode: multiply`.** The usual trick for painted art
is to keep the white background and multiply it onto the page. That was the
original plan here and it was dropped: multiply composites against the nearest
stacking context, so any ancestor with a transform, filter, opacity, or z-index
silently traps the blend and the white box reappears — and it can never sit over
a photograph or a dark panel without turning to mud. Real alpha has none of those
constraints, works in print, and survives `forced-colors` mode.

## Files

| File | Source scene | Notes |
|---|---|---|
| `tent.webp` | 1 | Style anchor for the whole set. Three peaks, scalloped awning, ticket booth, popcorn cart. |
| `badge.webp` | 1 | **Deliberately blank.** The marquee text is live HTML on top — it changes per year and must stay real text for accessibility, SEO, and the OG card. |
| `bunting.webp` | 1 | Twine meets the left and right edges at the same height so it tiles horizontally. |
| `balloon-1/2/3.webp` | 1 | Cut from one generated sheet and trimmed individually. |
| `parchment.jpg` | — | 880×880, mirror-tiled to remove the seam, warmed 26% toward `#F7EEDD`. Tile it; never `background-size: cover`. |
| `canopy-band.webp` | 2, 4 | The striped tent roof behind the site nav. |
| `canopy-valance.webp` | 2, 4 | The lit scalloped valance hanging below the nav. |
| `tent-open.webp` | 1 | `tent.webp` with the doorway knocked out to transparency. **If this is ever regenerated, the `DOOR` percentages in `HeroTentDoor.tsx` must be re-measured.** |

### The two canopy pieces are one image, cut in half

They were generated as a single canopy band, then **mirror-appended before cutting**, so both
halves share an identical horizontal phase. That is what lets the CSS tile them on one shared
period (`--v-header-tile-w`) and keep the scallops lined up under the stripes at every viewport
width. Re-cut them the same way or the two rows will drift apart.

The cut is at the bulb row, found by taking the most saturated image row rather than by eye.

## Licence

Generated via OpenArt (`nano-banana-pro`) from the client's own commissioned
invitation art, for this project only. The underlying invitation illustration is
the client's; check with them before reusing any of it elsewhere.
