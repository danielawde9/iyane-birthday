import type { Theme } from "./types";

/**
 * Year 2 — "The Sweet Sophomore": a bright modern carnival in candy red,
 * sun yellow, cobalt, mint, and cream. A clear visual departure from Year 1's
 * vintage editorial — chunky rounded display type (Bagel Fat One), friendly
 * rounded body (Quicksand), and a hand-written script (Caveat). The
 * `[data-theme="sweet-sophomore"]` selector in globals.css softens the
 * vintage component vocabulary (sharp corners → rounded pills, ledger inputs
 * → rounded fields) so the carnival vibe carries through the whole site.
 */
export const sweetSophomore: Theme = {
  slug: "sweet-sophomore",
  name: "The Sweet Sophomore",
  emoji: "🎈",
  palette: {
    bg: "#FFF8E7",
    surface: "#FFFFFF",
    paperDeep: "#FFE9B0",
    primary: "#E63946",
    primaryDeep: "#B82A36",
    projectorDeep: "#5C0E18",
    accent: "#FFD23F",
    accentBright: "#FFE375",
    goldDeep: "#E0A800",
    ink: "#1D2740",
    inkSoft: "#1D70B8",
    onDark: "#FFF8E7",
    onSurface: "#1D2740",
    muted: "#8E9AAB",
    joy: "#06A77D",
  },
  fonts: {
    display: 'var(--font-bagel), "Impact", "Arial Black", system-ui, sans-serif',
    body: 'var(--font-quicksand), -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    script: 'var(--font-caveat), "Brush Script MT", cursive',
    mono: 'var(--font-quicksand), -apple-system, BlinkMacSystemFont, sans-serif',
  },
  copy: {
    tagline: "The Sweet Sophomore · MMXXVII",
    heroScript: "Iyane",
    heroLead: "Year Two · two whole years of wonder",
    heroBig: "TWO",
    invite: "Round two under the lights — another room, another wall of photos.",
    dressCode: "Bright colors · come ready to celebrate",
  },
  decoration: "bigtop",
};
