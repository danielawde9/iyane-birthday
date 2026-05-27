import { cn } from "@/lib/cn";

/** Centered keepsake section heading: tracked small-caps eyebrow, an engraved
 *  italic-serif title, and a thin gold rule. */
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
          "h-title mt-3 text-4xl sm:text-5xl",
          onDark ? "text-on-dark" : "text-ink text-engrave",
        )}
      >
        {title}
      </h2>
      <hr className="rule-gold mx-auto mt-5 w-44" />
    </div>
  );
}
