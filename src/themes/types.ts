/**
 * A Theme is one year's visual identity. The palette is injected as CSS variables
 * at the document root (so the whole site re-skins by swapping the active theme),
 * and the copy provides the year-specific wording the invitation renders.
 *
 * Adding next year = add a new Theme module + register it, then point the active
 * event row at its slug. Past photos are untouched.
 */

export interface ThemePalette {
  bg: string; // page background (paper)
  surface: string; // cards / warm panels
  paperDeep: string; // deepest paper tint (photo tile backing)
  primary: string; // brand color (ink navy for year 1)
  primaryDeep: string; // darker brand shade (projector navy)
  projectorDeep: string; // deepest navy (projector vignette edge)
  accent: string; // gold
  accentBright: string; // highlight gold (soft foil)
  goldDeep: string; // deep gold (eyebrows, hovers)
  ink: string; // ink detail (crest, bow tie)
  inkSoft: string; // secondary ink (sub-headings)
  onDark: string; // text on primary/dark
  onSurface: string; // text on light surfaces (body)
  muted: string; // tertiary text
}

export interface ThemeCopy {
  tagline: string; // e.g. "Mr. ONEderful"
  heroScript: string; // child's name, set in the script font
  heroLead: string; // e.g. "is turning"
  heroBig: string; // e.g. "ONE"
  invite: string; // short invitation line
  dressCode: string; // suggested dress code
}

export type DecorationKind = "bowtie";

export interface Theme {
  slug: string;
  name: string;
  emoji: string;
  palette: ThemePalette;
  copy: ThemeCopy;
  decoration: DecorationKind;
}
