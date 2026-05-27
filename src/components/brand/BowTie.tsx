import type { SVGProps } from "react";

/** The recurring bow-tie motif. Colour it with `color`/`text-*` (uses currentColor). */
export function BowTie(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 120 56" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M60 28 8 6 8 50Z" />
      <path d="M60 28 112 6 112 50Z" />
      <rect x="52" y="16" width="16" height="24" rx="5" />
    </svg>
  );
}
