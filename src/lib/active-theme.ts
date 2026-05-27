import { getActiveEvent } from "@/db/queries";
import { getTheme, DEFAULT_THEME_SLUG, type Theme } from "@/themes";

/** The theme for the currently active birthday year (falls back to the default). */
export async function getActiveTheme(): Promise<Theme> {
  try {
    const event = await getActiveEvent();
    return getTheme(event?.themeSlug ?? DEFAULT_THEME_SLUG);
  } catch {
    return getTheme(DEFAULT_THEME_SLUG);
  }
}
