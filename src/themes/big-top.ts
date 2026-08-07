import type { Theme } from "./types";

/**
 * Year 1 — "The Greatest Little Show on Earth": a hand-painted watercolor
 * circus identity in faded madder red, dusty azure, marigold gold and
 * tea-stained parchment. The site is meant to read as the same artist's hand as
 * the animated invitation the guests received — see `public/art/CREDITS.md`.
 *
 * Every hex below is sampled from that film (`#A3322E` is its red, `#596C90`
 * its blue, `#D5A76A` its gold) and then contrast-checked against the parchment
 * ground. Two pairings are deliberately NOT usable and are worth knowing before
 * you reach for them:
 *
 *  - `accent` on `primary` is 3.13:1 — gold on red fails AA. Watercolor ochre is
 *    a dark pigment; there is no believable version of it that also passes on a
 *    madder red. On the red bands use `accentBright` (5.17:1) instead.
 *  - `muted` is the tertiary/placeholder tone at 4.69:1. It passes, but only
 *    just; don't push it lighter.
 *
 * The slug stays "big-top" on purpose. The active event row resolves through it
 * (and through the "mr-onederful" alias in ./index.ts), so re-skinning in place
 * changes the live site with no database migration. A new slug would have left
 * every existing row on the old letterpress look.
 */
export const bigTop: Theme = {
  slug: "big-top",
  name: "The Greatest Little Show on Earth",
  emoji: "🎪",
  palette: {
    bg: "#F7EEDD", // tea-stained parchment
    surface: "#FBF5E9", // lighter paper patch, for cards that sit above the ground
    paperDeep: "#EDDFC4", // deeper tea wash — tile backing, panel fill
    primary: "#A3322E", // madder red, sampled from the film's tent stripe
    primaryDeep: "#82241F", // shadow side of the red wash
    projectorDeep: "#2A1D14", // deep umber — slideshow backdrop
    accent: "#D5A76A", // yellow-ochre pigment. A FILL, never text on cream.
    accentBright: "#F2DDB4", // pale ochre wash — the highlight tone on red
    goldDeep: "#8F5C1C", // burnt ochre, for small text on cream (4.91:1)
    ink: "#3A2B20", // sepia-brown ink — there is no black in this system
    inkSoft: "#6E594A", // diluted ink (5.71:1)
    onDark: "#FBF3E4", // cream on red (6.24:1)
    onSurface: "#3A2B20", // body ink (11.79:1)
    muted: "#7A6752", // dry-brush grey-brown (4.69:1)
    joy: "#596C90", // dusty azure, the film's third hue
  },
  fonts: {
    display: 'var(--font-bevan), Rockwell, "Courier Slab", Georgia, serif',
    body: 'var(--font-lora), Lora, Georgia, "Times New Roman", serif',
    script: 'var(--font-yellowtail), "Brush Script MT", cursive',
    mono: 'var(--font-elite), "Special Elite", "Courier New", monospace',
  },
  copy: {
    tagline: "The Greatest Little Show on Earth",
    heroScript: "Iyane",
    heroLead: "The Greatest Little Show on Earth",
    heroBig: "ONE",
    invite: "Come one, come all — a keepsake placed by the room.",
    dressCode: "Sunday best · stripes encouraged",
  },
  decoration: "bigtop",
};
