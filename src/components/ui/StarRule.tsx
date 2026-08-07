import { cn } from "@/lib/cn";

/**
 * The shared section divider. One implementation, used by both the SectionTitle
 * lockup (narrow) and standalone separators (full width), so the motif is
 * identical everywhere.
 *
 * The shape is chosen entirely in CSS, not here: `.rule-gold` reads
 * `--v-rule-image` / `--v-rule-glyph-display` from the active theme, so the
 * watercolor years paint a string of bunting while the older years keep their
 * ink line with a ★ punched into the middle. That indirection is what lets an
 * archive year nested under a different `data-theme` swap the divider along with
 * everything else.
 *
 * `onDark` deliberately does NOT use the painted bunting: over the red footer
 * band a printed twine reads as a smudge. It gets a plain hairline instead.
 */
export function StarRule({
  className,
  onDark = false,
}: {
  /** Width / margin utilities. Defaults to full width of its container. */
  className?: string;
  onDark?: boolean;
}) {
  if (onDark) {
    return (
      <div aria-hidden="true" className={cn("flex items-center gap-3 text-on-dark", className)}>
        <span className="h-px flex-1 bg-current opacity-60" />
        <span className="text-accent-bright text-[10px] leading-none">◆</span>
        <span className="h-px flex-1 bg-current opacity-60" />
      </div>
    );
  }

  return <div aria-hidden="true" className={cn("rule-gold w-full", className)} />;
}
