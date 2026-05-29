import { cn } from "@/lib/cn";
import { StarRule } from "@/components/ui/StarRule";

/** Centered editorial section heading: a Space-Mono eyebrow, a heavy Arimo
 *  title, and an ink rule with a centered red star. */
export function SectionTitle({
  eyebrow,
  title,
  onDark = false,
}: {
  eyebrow?: string;
  title: string;
  onDark?: boolean;
}) {
  return (
    <div className="text-center">
      {eyebrow && <p className={cn("eyebrow", onDark && "eyebrow-mute")}>{eyebrow}</p>}
      <h2
        className={cn(
          "h-title mt-3 text-4xl uppercase tracking-tight sm:text-5xl",
          onDark ? "text-on-dark" : "text-ink text-engrave",
        )}
      >
        {title}
      </h2>
      <StarRule className="mx-auto mt-5 w-44" onDark={onDark} />
    </div>
  );
}
