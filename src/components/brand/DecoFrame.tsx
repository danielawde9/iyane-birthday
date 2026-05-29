import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * A vintage playbill frame: 4px ink outer border with a 1px ink inner stroke
 * (the "misregistered print" ghost-feel), parchment fill, sharp corners. Same
 * `{ children, className }` API as the prior keepsake DecoFrame.
 */
export function DecoFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "relative bg-paper-deep",
        // 4px ink frame with a stacked 1px ink inner stroke (the "misregistered"
        // print look from the spec).
        className,
      )}
      style={{
        border: "4px solid var(--c-ink)",
        boxShadow: "inset 0 0 0 1px var(--c-bg), inset 0 0 0 2px var(--c-ink)",
      }}
    >
      {/* corner stars */}
      <Star className="absolute -left-2 -top-2 h-4 w-4 text-ink" />
      <Star className="absolute -right-2 -top-2 h-4 w-4 text-ink" />
      <Star className="absolute -bottom-2 -left-2 h-4 w-4 text-ink" />
      <Star className="absolute -bottom-2 -right-2 h-4 w-4 text-ink" />
      {children}
    </div>
  );
}

function Star({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <polygon
        points="12,2 14.5,9 22,9 16,13.5 18.5,21 12,16.5 5.5,21 8,13.5 2,9 9.5,9"
        fill="currentColor"
      />
    </svg>
  );
}
