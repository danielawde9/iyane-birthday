import { cn } from "@/lib/cn";
import { SectionTitle } from "@/components/ui/SectionTitle";

/**
 * The single page wrapper used by every (site) route so navigation feels
 * consistent across pages and breakpoints. It owns:
 *   - the outer container width + responsive padding (matched to SiteHeader,
 *     so the page edge aligns with the header on every screen size), and
 *   - the centered header block (eyebrow + title + optional lead).
 *
 * Only two widths exist: the default (text/form pages) and `wide` for the two
 * photo-grid pages (/gallery and /archive/[year]) which share <Gallery/>.
 */
export function PageShell({
  eyebrow,
  title,
  lead,
  wide = false,
  headerExtra,
  children,
}: {
  eyebrow?: string;
  title: string;
  lead?: React.ReactNode;
  wide?: boolean;
  /** Optional element rendered under the lead (e.g. a back-link). */
  headerExtra?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("mx-auto px-4 py-12 sm:px-8 sm:py-16", wide ? "max-w-6xl" : "max-w-5xl")}>
      <header className="mb-10 text-center sm:mb-14">
        <SectionTitle eyebrow={eyebrow} title={title} />
        {lead && (
          <p className="mx-auto mt-5 max-w-xl font-display text-base italic text-ink-soft sm:text-lg">
            {lead}
          </p>
        )}
        {headerExtra && <div className="mt-5">{headerExtra}</div>}
      </header>
      {children}
    </div>
  );
}
