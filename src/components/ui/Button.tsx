import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Variant = "gold" | "outline" | "outlineNavy" | "navy";

// `whitespace-nowrap` matters: the display face is a heavy slab, so a two-word
// label like "Add Photos" wraps inside the header's fixed-height band and breaks
// the button's shape.
const base = "btn-ticket whitespace-nowrap";

// The shape comes entirely from the theme (`--v-radius-pill`, `--v-btn-mask`,
// `--v-btn-wash`): a painted lozenge in the watercolor years, a notched raffle
// ticket in the vintage ones. Variant names are legacy and no longer describe
// the colors — they are kept so call sites don't all have to change.
//
// - gold     → ochre-washed (the default / "Add Yours" affordance)
// - outline  → parchment-filled with an ink frame (secondary)
// - outlineNavy → same outline, used on dark
// - navy     → red-washed (primary action on light)
const variants: Record<Variant, string> = {
  gold: "",
  outline: "btn-ticket-blue !bg-bg !bg-none !text-ink",
  outlineNavy: "btn-ticket-blue !bg-bg !bg-none !text-ink",
  navy: "btn-ticket-red",
};

export function Button({ variant = "gold", className, ...props }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={cn(base, variants[variant], className)} {...props} />;
}

export function ButtonLink({
  variant = "gold",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={cn(base, variants[variant], className)} {...props} />;
}
