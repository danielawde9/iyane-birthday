import type { SVGProps } from "react";

/**
 * A small run of triangular pennants, used as a card/section ornament.
 *
 * Still exported as `BowTie` for back-compat — it was a bow tie two rebrands
 * ago, then a row of stars — so call sites don't have to change.
 *
 * Drawn rather than reusing `/art/bunting.webp` on purpose: at this size (a
 * ~40px-tall accent) the painted artwork's brush detail turns to mush, whereas
 * flat SVG fills stay crisp and cost no extra request. The fills come from theme
 * variables, so it still re-skins with an archive year.
 */
export function BowTie(props: SVGProps<SVGSVGElement>) {
  const flags = [12, 45, 78, 110, 142, 175, 208];
  const fills = ["var(--c-primary)", "var(--c-joy)", "var(--c-accent)"];
  return (
    <svg viewBox="0 0 220 30" aria-hidden="true" {...props}>
      {/* The twine, sagging gently across the run. */}
      <path
        d="M2 4 Q110 16 218 4"
        fill="none"
        stroke="var(--c-gold-deep)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
      />
      {flags.map((x, i) => {
        // Hang each flag off the twine rather than a straight line, by sampling
        // the same parabola the path describes.
        const t = x / 220;
        const y = 4 + 12 * (1 - (2 * t - 1) ** 2);
        return (
          <polygon
            key={x}
            points={`${x - 8},${y} ${x + 8},${y} ${x},${y + 15}`}
            fill={fills[i % fills.length]}
            opacity="0.88"
          />
        );
      })}
    </svg>
  );
}
