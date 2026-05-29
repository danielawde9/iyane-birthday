import type { Theme } from "./types";

/**
 * Year 2 - "The Tiny Astronaut": a playful space mission in lunar white,
 * orbital cobalt, rocket orange, star yellow, and aqua. A clear visual
 * departure from Year 1's vintage editorial: rounded capsule controls,
 * smooth mission-patch cards, and a lighter space palette that still feels
 * bright enough for a birthday archive.
 */
export const tinyAstronaut: Theme = {
  slug: "tiny-astronaut",
  name: "The Tiny Astronaut",
  emoji: "🚀",
  palette: {
    bg: "#F7F8FF",
    surface: "#FFFFFF",
    paperDeep: "#E8F0FF",
    primary: "#2438A7",
    primaryDeep: "#111B5C",
    projectorDeep: "#090B1F",
    accent: "#FF7A1A",
    accentBright: "#FFE066",
    goldDeep: "#B24E00",
    ink: "#161827",
    inkSoft: "#4C5F9F",
    onDark: "#F7F8FF",
    onSurface: "#161827",
    muted: "#8790B4",
    joy: "#00B8D9",
  },
  fonts: {
    display: 'var(--font-bagel), "Impact", "Arial Black", system-ui, sans-serif',
    body: 'var(--font-quicksand), -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    script: 'var(--font-caveat), "Brush Script MT", cursive',
    mono: 'var(--font-quicksand), -apple-system, BlinkMacSystemFont, sans-serif',
  },
  copy: {
    tagline: "Mission Two · Tiny Astronaut",
    heroScript: "Iyane",
    heroLead: "Mission Control reports",
    heroBig: "TWO",
    invite: "A second orbit around the sun - crew photos, wishes, and tiny launch notes.",
    dressCode: "Silver, white, and space-bright colors",
  },
  decoration: "bigtop",
};
