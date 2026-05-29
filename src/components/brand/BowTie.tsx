import type { SVGProps } from "react";

/**
 * A row of 5-point stars used as a section-title underline ornament (the
 * legacy "BowTie" export, repurposed as star bunting). currentColor controls
 * the fill so any caller's text-* color tints it.
 */
export function BowTie(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 220 28" fill="currentColor" aria-hidden="true" {...props}>
      {[20, 60, 110, 160, 200].map((cx, i) => {
        const r = i === 2 ? 11 : 8;
        return (
          <polygon
            key={cx}
            points={`${cx},${14 - r} ${cx + r * 0.3},${14 - r * 0.3} ${cx + r * 0.95},${14 - r * 0.3} ${cx + r * 0.45},${14 + r * 0.1} ${cx + r * 0.6},${14 + r * 0.9} ${cx},${14 + r * 0.45} ${cx - r * 0.6},${14 + r * 0.9} ${cx - r * 0.45},${14 + r * 0.1} ${cx - r * 0.95},${14 - r * 0.3} ${cx - r * 0.3},${14 - r * 0.3}`}
          />
        );
      })}
    </svg>
  );
}
