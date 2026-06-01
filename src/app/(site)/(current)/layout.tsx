import { getActiveEvent } from "@/db/queries";
import { DEFAULT_THEME_SLUG, getTheme } from "@/themes";
import { buildSiteChrome } from "@/lib/year-theme-shell";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

export default async function CurrentSiteLayout({ children }: { children: React.ReactNode }) {
  const event = await getActiveEvent();
  const theme = getTheme(event?.themeSlug ?? DEFAULT_THEME_SLUG);
  const chrome = event ? buildSiteChrome({ event, theme, mode: "current" }) : undefined;

  return (
    <>
      <SiteHeader chrome={chrome} />
      <main className="flex-1">{children}</main>
      <SiteFooter chrome={chrome} />
    </>
  );
}
