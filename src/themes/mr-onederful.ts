import type { Theme } from "./types";

/**
 * Year 1 — the "Iyane keepsake": an engraved-invitation identity in ink navy,
 * antique gold, and warm paper. (Slug kept as "mr-onederful" so existing event
 * rows keep resolving; only the visual identity and voice were refined.)
 */
export const mrOnederful: Theme = {
  slug: "mr-onederful",
  name: "Year One",
  emoji: "🎀",
  palette: {
    bg: "#F6EFE2",
    surface: "#EFE6D3",
    paperDeep: "#E6DABF",
    primary: "#0E2240",
    primaryDeep: "#091627",
    projectorDeep: "#060F1B",
    accent: "#C9A24B",
    accentBright: "#E0C788",
    goldDeep: "#A8862F",
    ink: "#0E2240",
    inkSoft: "#2A3A57",
    onDark: "#F6EFE2",
    onSurface: "#0E2240",
    muted: "#6B7691",
    joy: "#C9A24B",
  },
  copy: {
    tagline: "A Keepsake · Year One",
    heroScript: "Iyane",
    heroLead: "year one",
    heroBig: "MMXXVI",
    invite: "A page written by the room — gathered from the day.",
    dressCode: "Dapper attire encouraged",
  },
  decoration: "bowtie",
};
