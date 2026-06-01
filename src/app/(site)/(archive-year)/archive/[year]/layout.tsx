import { notFound } from "next/navigation";
import { listEvents } from "@/db/queries";
import { getArchiveYearThemeShell } from "@/lib/year-theme-shell";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

export const dynamic = "force-dynamic";

export default async function ArchiveYearLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ year: string }>;
}) {
  const { year } = await params;
  const shell = getArchiveYearThemeShell(await listEvents(), year);
  if (!shell) notFound();

  return (
    <div
      className="theme-canvas flex min-h-screen flex-1 flex-col"
      style={shell.cssVars as React.CSSProperties}
      data-theme={shell.theme.slug}
    >
      <SiteHeader chrome={shell.chrome} />
      <main className="flex-1">{children}</main>
      <SiteFooter chrome={shell.chrome} />
    </div>
  );
}
