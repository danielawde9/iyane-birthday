import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * A red marquee band with a yellow scalloped tent-flap edge along the bottom.
 * Children render inside the red band; the scalloped strip dangles below in
 * the flow (it's part of the same component so callers don't have to wire it).
 */
export function ScallopedHeader({
  children,
  className,
  scallop = "bottom",
}: {
  children: ReactNode;
  className?: string;
  /** Which edge gets the tent-flap scallops. */
  scallop?: "bottom" | "top" | "none";
}) {
  return (
    <div className={cn("site-marquee relative bg-primary text-on-dark", className)}>
      {children}
      {scallop === "bottom" && <Scallops position="bottom" />}
      {scallop === "top" && <Scallops position="top" />}
    </div>
  );
}

/** A row of yellow semi-circles dangling off the red band. */
function Scallops({ position }: { position: "top" | "bottom" }) {
  const isBottom = position === "bottom";
  return (
    <div
      aria-hidden="true"
      className="site-scallops pointer-events-none absolute left-0 right-0 h-4"
      style={isBottom ? { bottom: "-16px" } : { top: "-16px" }}
    >
      <svg
        viewBox="0 0 1200 32"
        preserveAspectRatio="none"
        className="h-full w-full"
      >
        {/* generate semi-circles every 36px so the row tiles across any width */}
        {Array.from({ length: 34 }).map((_, i) => {
          const cx = i * 36 + 18;
          return (
            <path
              key={i}
              d={
                isBottom
                  ? `M ${cx - 18} 0 A 18 18 0 0 0 ${cx + 18} 0 Z`
                  : `M ${cx - 18} 32 A 18 18 0 0 1 ${cx + 18} 32 Z`
              }
              fill="var(--c-accent)"
              stroke="var(--c-ink)"
              strokeWidth="1"
            />
          );
        })}
      </svg>
    </div>
  );
}

/** Back-compat: the previous `Marquee` export is preserved as an alias. */
export const Marquee = ScallopedHeader;
export function BulbRow() { return null; }
