import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * The site's marquee band, with a decorative valance hanging off one edge.
 *
 * Both the band's fill and the valance are painted entirely in CSS from
 * `--v-header-*` (see globals.css): the watercolor years use the film's circus
 * canopy — a striped tent roof behind the nav and a lit scalloped valance below
 * it — while a theme that sets no canopy artwork simply gets a flat colour band
 * and no valance. Keeping the choice in CSS is what lets an archive year nested
 * under a different `data-theme` re-skin the whole thing.
 *
 * Note there is no `bg-primary` here. The band's colour comes from
 * `--v-header-bg-color`, because the painted valance has transparent gaps
 * between its scallops and a background colour on this element would show
 * through them as a hard rectangle.
 */
export function ScallopedHeader({
  children,
  className,
  scallop = "bottom",
}: {
  children: ReactNode;
  className?: string;
  /** Which edge gets the decorative valance. */
  scallop?: "bottom" | "top" | "none";
}) {
  return (
    <div className={cn("site-marquee relative text-on-dark", className)}>
      {children}
      {scallop !== "none" && (
        <div
          aria-hidden="true"
          className={cn(
            "site-valance pointer-events-none absolute left-0 right-0",
            scallop === "bottom" ? "is-bottom" : "is-top",
          )}
        />
      )}
    </div>
  );
}
