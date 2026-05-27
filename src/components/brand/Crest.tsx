import type { SVGProps } from "react";

/**
 * The "Iyane keepsake" crest — engraved line-art: a thin gold ring framing a
 * bow-tie whose knot is a monogram medallion. Drawn entirely in antique gold
 * (theme `--c-accent`) so it reads on warm paper and on the dark home alike.
 * Colours come from theme CSS variables, so it re-skins per year.
 */
export function Crest({
  title = "Iyane · Year One",
  mono = "I",
  ...props
}: SVGProps<SVGSVGElement> & { title?: string; mono?: string }) {
  return (
    <svg viewBox="0 0 120 120" role="img" aria-label={title} {...props}>
      {/* outer frame */}
      <circle cx="60" cy="60" r="54" fill="none" stroke="var(--c-accent)" strokeWidth="1.1" />
      <circle cx="60" cy="60" r="49" fill="none" stroke="var(--c-accent)" strokeWidth="0.5" strokeOpacity="0.5" />

      {/* hairline rules + end dots */}
      <line x1="14" y1="60" x2="30" y2="60" stroke="var(--c-accent)" strokeWidth="0.6" />
      <line x1="90" y1="60" x2="106" y2="60" stroke="var(--c-accent)" strokeWidth="0.6" />
      <circle cx="14" cy="60" r="1.1" fill="var(--c-accent)" />
      <circle cx="106" cy="60" r="1.1" fill="var(--c-accent)" />

      {/* bow-tie wings flanking the medallion */}
      <path d="M48 60 L28 50 L28 70 Z" fill="none" stroke="var(--c-accent)" strokeWidth="0.9" strokeLinejoin="miter" />
      <path d="M44 60 L31 54 L31 66" fill="none" stroke="var(--c-accent)" strokeWidth="0.45" strokeOpacity="0.6" />
      <path d="M72 60 L92 50 L92 70 Z" fill="none" stroke="var(--c-accent)" strokeWidth="0.9" strokeLinejoin="miter" />
      <path d="M76 60 L89 54 L89 66" fill="none" stroke="var(--c-accent)" strokeWidth="0.45" strokeOpacity="0.6" />

      {/* knot medallion + monogram */}
      <circle cx="60" cy="60" r="13" fill="none" stroke="var(--c-accent)" strokeWidth="0.9" />
      <circle cx="60" cy="60" r="10" fill="none" stroke="var(--c-accent)" strokeWidth="0.4" strokeOpacity="0.55" />
      <text
        x="60"
        y="66"
        textAnchor="middle"
        fill="var(--c-accent)"
        fontSize="17"
        style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 500 }}
      >
        {mono}
      </text>

      {/* dots above/below the knot */}
      <circle cx="60" cy="42" r="0.9" fill="var(--c-accent)" />
      <circle cx="60" cy="78" r="0.9" fill="var(--c-accent)" />
    </svg>
  );
}

/** Compact, ring-less crest with heavier strokes — for the slideshow watermark. */
export function CrestSmall({
  title = "Iyane",
  mono = "I",
  ...props
}: SVGProps<SVGSVGElement> & { title?: string; mono?: string }) {
  return (
    <svg viewBox="0 0 120 80" role="img" aria-label={title} {...props}>
      <path d="M52 40 L24 26 L24 54 Z" fill="none" stroke="var(--c-accent)" strokeWidth="1.4" strokeLinejoin="miter" />
      <path d="M68 40 L96 26 L96 54 Z" fill="none" stroke="var(--c-accent)" strokeWidth="1.4" strokeLinejoin="miter" />
      <circle cx="60" cy="40" r="14" fill="none" stroke="var(--c-accent)" strokeWidth="1.4" />
      <text
        x="60"
        y="46.5"
        textAnchor="middle"
        fill="var(--c-accent)"
        fontSize="17"
        style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 500 }}
      >
        {mono}
      </text>
    </svg>
  );
}
