import type { Theme, ThemePalette } from "./types";
import { mrOnederful } from "./mr-onederful";
import { bigTop } from "./big-top";
import { tinyAstronaut } from "./tiny-astronaut";

/** Registry of every year's theme, keyed by slug. */
export const themes: Record<string, Theme> = {
  [bigTop.slug]: bigTop,
  [tinyAstronaut.slug]: tinyAstronaut,
  [mrOnederful.slug]: mrOnederful,
};

export const DEFAULT_THEME_SLUG = bigTop.slug;

/**
 * Resolve a theme by slug, falling back to the default.
 *
 * Back-compat: Year 1's event row was originally seeded with slug "mr-onederful"
 * (the pre-rebrand letterpress theme). The rebrand to The Grand Jubilee kept
 * the slug aliased so existing DB rows keep working without a migration. New
 * installs and future years should pick a real registered slug (e.g. "big-top",
 * or a brand-new theme slug like "tiny-astronaut" for Year 2). When you add a new
 * year's theme, register a fresh slug — don't reuse "mr-onederful".
 */
export function getTheme(slug: string | null | undefined): Theme {
  if (slug === "mr-onederful") return themes[bigTop.slug] ?? themes[DEFAULT_THEME_SLUG];
  if (slug === "sweet-sophomore") return themes[tinyAstronaut.slug] ?? themes[DEFAULT_THEME_SLUG];
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
  joy: "--c-joy",
};

/** Map a theme's palette + fonts to the CSS custom properties consumed by
 *  globals.css. Fonts are optional and only emitted when the theme overrides them.
 *
 *  Fonts are emitted as `--th-font-*`, NOT `--font-*`. That indirection is load
 *  bearing: globals.css declares Tailwind's font utilities inside `@theme inline`,
 *  and `inline` means the utility is compiled with the *resolved value* rather
 *  than a `var()` reference — so `.font-display` bakes in whatever `--font-display`
 *  held at build time and can never see a per-theme override injected at runtime.
 *  Writing to `--th-font-*` instead, which the build-time stacks read through
 *  `var(--th-font-display, <default>)`, lets both the utilities and the
 *  hand-written CSS follow the active theme. */
export function themeToCssVars(theme: Theme): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const key of Object.keys(PALETTE_VAR_MAP) as (keyof ThemePalette)[]) {
    vars[PALETTE_VAR_MAP[key]] = theme.palette[key];
  }
  if (theme.fonts) {
    vars["--th-font-display"] = theme.fonts.display;
    vars["--th-font-body"] = theme.fonts.body;
    vars["--th-font-script"] = theme.fonts.script;
    if (theme.fonts.mono) vars["--th-font-mono"] = theme.fonts.mono;
  }
  return vars;
}

export type { Theme, ThemePalette, ThemeCopy } from "./types";
