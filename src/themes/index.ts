import type { Theme, ThemePalette } from "./types";
import { mrOnederful } from "./mr-onederful";

/** Registry of every year's theme, keyed by slug. */
export const themes: Record<string, Theme> = {
  [mrOnederful.slug]: mrOnederful,
};

export const DEFAULT_THEME_SLUG = mrOnederful.slug;

/** Resolve a theme by slug, falling back to the default. */
export function getTheme(slug: string | null | undefined): Theme {
  if (slug && themes[slug]) return themes[slug];
  return themes[DEFAULT_THEME_SLUG];
}

export function listThemes(): Theme[] {
  return Object.values(themes);
}

const PALETTE_VAR_MAP: Record<keyof ThemePalette, string> = {
  bg: "--c-bg",
  surface: "--c-surface",
  paperDeep: "--c-paper-deep",
  primary: "--c-primary",
  primaryDeep: "--c-primary-deep",
  projectorDeep: "--c-projector-deep",
  accent: "--c-accent",
  accentBright: "--c-accent-bright",
  goldDeep: "--c-gold-deep",
  ink: "--c-ink",
  inkSoft: "--c-ink-soft",
  onDark: "--c-on-dark",
  onSurface: "--c-on-surface",
  muted: "--c-muted",
};

/** Map a theme's palette to the CSS custom properties consumed by globals.css. */
export function themeToCssVars(theme: Theme): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const key of Object.keys(PALETTE_VAR_MAP) as (keyof ThemePalette)[]) {
    vars[PALETTE_VAR_MAP[key]] = theme.palette[key];
  }
  return vars;
}

export type { Theme, ThemePalette, ThemeCopy } from "./types";
