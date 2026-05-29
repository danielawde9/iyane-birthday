import type { SVGProps } from "react";

/**
 * A wood-type "1" — heavy Arimo on parchment with a 1-point ink rule running
 * around it and a small gold star at the top, the way a playbill would set
 * a single-character lockup.
 */
export function BigOne(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 140 200" role="img" aria-label="One" {...props}>
      {/* ink rule frame */}
      <rect x="6" y="6" width="128" height="188" fill="var(--c-paper-deep)" stroke="var(--c-ink)" strokeWidth="3" />
      <rect x="14" y="14" width="112" height="172" fill="none" stroke="var(--c-ink)" strokeWidth="1" />
      {/* the numeral */}
      <text
        x="70"
        y="170"
        textAnchor="middle"
        fill="var(--c-primary)"
        stroke="var(--c-ink)"
        strokeWidth="1.5"
        fontSize="180"
        style={{ fontFamily: "var(--font-display)", fontWeight: 700, letterSpacing: "-0.04em" }}
      >
        1
      </text>
      {/* gold star at the top */}
      <polygon
        points="70,30 74,40 84,40 76,46 79,56 70,50 61,56 64,46 56,40 66,40"
        fill="var(--c-accent)"
        stroke="var(--c-ink)"
        strokeWidth="1"
      />
    </svg>
  );
}
