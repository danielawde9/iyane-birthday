import type { Theme } from "./types";

/**
 * Year 1 — "The Grand Jubilee": a vintage editorial/letterpress identity in
 * Big Top Red, Aged Gold, Midnight ink, and parchment cream. The site feels
 * like a physical artifact — a hand-printed playbill found in a trunk. Slug
 * is kept as "big-top" so existing event rows resolve.
 */
export const bigTop: Theme = {
  slug: "big-top",
  name: "The Grand Jubilee",
  emoji: "🎟️",
  palette: {
    bg: "#FFF8F0",
    surface: "#FFF8F0",
    paperDeep: "#FCEDC5",
    primary: "#AF101A",
    primaryDeep: "#930010",
    projectorDeep: "#410003",
    accent: "#FBC02D",
    accentBright: "#FFDFA0",
    goldDeep: "#795900",
    ink: "#221B03",
    inkSoft: "#5B403D",
    onDark: "#FFF8F0",
    onSurface: "#221B03",
    muted: "#8F6F6C",
    joy: "#AF101A",
  },
  fonts: {
    display: 'var(--font-arimo), "Arial Black", "Helvetica Neue", Helvetica, system-ui, sans-serif',
    body: 'var(--font-caslon), "Libre Caslon Text", Caslon, Georgia, "Times New Roman", serif',
    script: 'var(--font-caslon), "Libre Caslon Text", Caslon, Georgia, serif',
    mono: 'var(--font-spacemono), "Courier New", "Andale Mono", monospace',
  },
  copy: {
    tagline: "The Grand Jubilee · Anno MMXXVI",
    heroScript: "Iyane",
    heroLead: "The Greatest Little Show on Earth",
    heroBig: "ONE",
    invite: "An evening under the big top — a keepsake placed by the room.",
    dressCode: "Sunday best · stars encouraged",
  },
  decoration: "bigtop",
};
