import type { EventRow } from "../db/schema";
import { getTheme, themeToCssVars, type Theme } from "../themes";

export interface SiteChrome {
  mode: "current" | "archive";
  year: number;
  yearLabel: string;
  themeLabel: string;
  homeHref: string;
}

export interface ArchiveYearThemeShell {
  event: EventRow;
  theme: Theme;
  cssVars: Record<string, string>;
  chrome: SiteChrome;
}

export function buildSiteChrome({
  event,
  theme,
  mode,
}: {
  event: EventRow;
  theme: Theme;
  mode: SiteChrome["mode"];
}): SiteChrome {
  return {
    mode,
    year: event.year,
    yearLabel: mode === "archive" ? `Viewing Year ${event.year}` : `Year ${event.year}`,
    themeLabel: theme.name,
    homeHref: mode === "archive" ? `/archive/${event.year}` : "/",
  };
}

export function getArchiveYearThemeShell(events: EventRow[], year: string): ArchiveYearThemeShell | null {
  const event = events.find((item) => String(item.year) === year);
  if (!event) return null;

  const theme = getTheme(event.themeSlug);
  return {
    event,
    theme,
    cssVars: themeToCssVars(theme),
    chrome: buildSiteChrome({ event, theme, mode: "archive" }),
  };
}
