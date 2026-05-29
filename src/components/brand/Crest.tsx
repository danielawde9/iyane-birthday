import type { SVGProps } from "react";

/**
 * "The Grand Jubilee" mark — a gold medal: a 5-point gold star, an ink-ringed
 * medallion centered on it carrying the monogram, and four small ink stars at
 * 12 / 3 / 6 / 9 o'clock around the rim. Pure SVG, theme-driven.
 */
export function Crest({
  title = "Iyane · The Grand Jubilee",
  mono = "I",
  ...props
}: SVGProps<SVGSVGElement> & { title?: string; mono?: string }) {
  return (
    <svg viewBox="0 0 120 120" role="img" aria-label={title} {...props}>
      {/* outer ink ring */}
      <circle cx="60" cy="60" r="56" fill="var(--c-bg)" stroke="var(--c-ink)" strokeWidth="3" />
      {/* gold medal star */}
      <polygon
        points="60,16 70.6,46 102,46 76.7,64.6 86.4,94 60,76 33.6,94 43.3,64.6 18,46 49.4,46"
        fill="var(--c-accent)"
        stroke="var(--c-ink)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* inner medallion */}
      <circle cx="60" cy="62" r="14" fill="var(--c-primary)" stroke="var(--c-ink)" strokeWidth="2" />
      <text
        x="60"
        y="68"
        textAnchor="middle"
        fill="var(--c-accent)"
        fontSize="16"
        style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
      >
        {mono}
      </text>
      {/* compass-rose ink stars at 12 / 3 / 6 / 9 on the outer ring */}
      <SmallStar cx={60} cy={4} />
      <SmallStar cx={116} cy={60} />
      <SmallStar cx={60} cy={116} />
      <SmallStar cx={4} cy={60} />
    </svg>
  );
}

function SmallStar({ cx, cy }: { cx: number; cy: number }) {
  return (
    <polygon
      points={`${cx},${cy - 4} ${cx + 1.2},${cy - 1.2} ${cx + 4},${cy - 1.2} ${cx + 1.7},${cy + 0.5} ${cx + 2.5},${cy + 4} ${cx},${cy + 1.8} ${cx - 2.5},${cy + 4} ${cx - 1.7},${cy + 0.5} ${cx - 4},${cy - 1.2} ${cx - 1.2},${cy - 1.2}`}
      fill="var(--c-ink)"
    />
  );
}

/** Compact, ring-less badge — for the slideshow watermark. */
export function CrestSmall({
  title = "Iyane",
  mono = "I",
  ...props
}: SVGProps<SVGSVGElement> & { title?: string; mono?: string }) {
  return (
    <svg viewBox="0 0 120 80" role="img" aria-label={title} {...props}>
      <polygon
        points="60,8 71,38 100,38 76,56 86,86 60,68 34,86 44,56 20,38 49,38"
        fill="var(--c-accent)"
        stroke="var(--c-ink)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="60" cy="48" r="12" fill="var(--c-primary)" stroke="var(--c-ink)" strokeWidth="1.8" />
      <text
        x="60"
        y="53"
        textAnchor="middle"
        fill="var(--c-accent)"
        fontSize="16"
        style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
      >
        {mono}
      </text>
    </svg>
  );
}
