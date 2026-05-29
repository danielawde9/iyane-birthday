import { cn } from "@/lib/cn";

/**
 * The shared "ink rule with a centered red star" divider. One implementation,
 * used by both the SectionTitle lockup (narrow) and section separators (full
 * width) so the motif is identical everywhere.
 */
export function StarRule({
  className,
  onDark = false,
}: {
  /** Width / margin utilities. Defaults to full width of its container. */
  className?: string;
  onDark?: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn("flex items-center gap-3", onDark ? "text-on-dark" : "text-ink", className)}
    >
      <span className="h-px flex-1 bg-current" />
      <span className="text-primary text-xs leading-none">★</span>
      <span className="h-px flex-1 bg-current" />
    </div>
  );
}
