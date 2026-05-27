import type { SVGProps } from "react";

/** A large gold numeral "1" wearing a bow tie — the compact mark. */
export function BigOne(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 130 170" role="img" aria-label="One" {...props}>
      <defs>
        <linearGradient id="bigone-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--c-accent-bright)" />
          <stop offset="0.6" stopColor="var(--c-accent)" />
          <stop offset="1" stopColor="#a9842f" />
        </linearGradient>
      </defs>
      <text
        x="65"
        y="155"
        textAnchor="middle"
        fill="url(#bigone-gold)"
        fontSize="180"
        style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
      >
        1
      </text>
      {/* bow tie at the collar of the 1 */}
      <g transform="translate(65 44)" fill="var(--c-ink)">
        <path d="M0 0 -30 -13 -30 13Z" />
        <path d="M0 0 30 -13 30 13Z" />
        <rect x="-5" y="-7" width="10" height="14" rx="3" />
      </g>
    </svg>
  );
}
