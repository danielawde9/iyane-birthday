import { cn } from "@/lib/cn";

/**
 * The wordmark. One word, set in the theme's display face.
 *
 * It used to be a boxed, rotated "I" tile followed by "YANE", which read as two
 * separate things rather than a name — so the tile is gone and the name is a
 * single letterspaced unit.
 */
export function TextLogo({ className }: { className?: string }) {
  return (
    <span className={cn("iyane-wordmark inline-flex items-center align-middle", className)}>
      IYANE
    </span>
  );
}
