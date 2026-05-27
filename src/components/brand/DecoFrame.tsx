import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";

function Corner({ flip }: { flip: CSSProperties["transform"] }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className="pointer-events-none absolute h-7 w-7 text-accent"
      style={{ transform: flip }}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M3 16 V3 H16" />
      <path d="M9 22 V9 H22" opacity="0.6" />
      <circle cx="5" cy="5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Wraps content in an art-deco double-gold-rule frame with ornamented corners. */
export function DecoFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <span className="pointer-events-none absolute inset-0 rounded-[3px] border border-accent/55" aria-hidden />
      <span className="pointer-events-none absolute inset-[7px] rounded-[2px] border border-accent/25" aria-hidden />
      <span className="absolute left-2 top-2">
        <Corner flip="none" />
      </span>
      <span className="absolute right-2 top-2">
        <Corner flip="scaleX(-1)" />
      </span>
      <span className="absolute bottom-2 left-2">
        <Corner flip="scaleY(-1)" />
      </span>
      <span className="absolute bottom-2 right-2">
        <Corner flip="scale(-1,-1)" />
      </span>
      {children}
    </div>
  );
}
