import { cn } from "@/lib/cn";
import { SectionTitle } from "@/components/ui/SectionTitle";

/**
 * The single page wrapper used by every (site) route so navigation feels
 * consistent across pages and breakpoints. It owns:
 *   - the outer container width + responsive padding (matched to SiteHeader,
 *     so the page edge aligns with the header on every screen size), and
 *   - the centered header block (eyebrow + title + optional lead).
 *
 * Three widths exist: the default (text/form pages), `wide` for the photo-grid
 * pages (/gallery and /archive/[year]) which share <Gallery/>, and `full` which
 * lets the photo wall run edge to edge on large screens.
 *
 * `full` keeps the HEADER centred and readable at the default width — only the
 * children go full-bleed. A centred title above an edge-to-edge grid is the
 * point; letting the lead paragraph stretch to 2000px would not be.
 */
export function PageShell({
  eyebrow,
  title,
  lead,
  wide = false,
  full = false,
  headerExtra,
  children,
}: {
  eyebrow?: string;
  title: string;
  lead?: React.ReactNode;
  wide?: boolean;
  /** Let the children run edge to edge. Takes precedence over `wide`. */
  full?: boolean;
  /** Optional element rendered under the lead (e.g. a back-link). */
  headerExtra?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const pad = "px-4 sm:px-8";
  return (
    <div className={cn("py-12 sm:py-16", full ? "w-full" : cn("mx-auto", pad, wide ? "max-w-6xl" : "max-w-5xl"))}>
      <header className={cn("mb-10 text-center sm:mb-14", full && cn("mx-auto max-w-5xl", pad))}>
        <SectionTitle eyebrow={eyebrow} title={title} />
        {lead && (
          <p className="mx-auto mt-5 max-w-xl font-display text-base italic text-ink-soft sm:text-lg">
            {lead}
          </p>
        )}
        {headerExtra && <div className="mt-5">{headerExtra}</div>}
      </header>
      <div className={cn(full && pad)}>{children}</div>
    </div>
  );
}
