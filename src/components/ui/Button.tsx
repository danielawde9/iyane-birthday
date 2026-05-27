import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Variant = "gold" | "outline" | "outlineNavy" | "navy";

const base =
  "inline-flex items-center justify-center gap-2.5 rounded-[2px] px-6 py-3 font-sc text-[11.5px] font-medium uppercase tracking-[0.26em] transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

// Keepsake buttons: an outline-gold "Add Yours" (gold), an ink-fill primary
// (navy), and two ghost variants. All settle to gold or ink on hover.
const variants: Record<Variant, string> = {
  gold: "bg-transparent text-ink border border-accent hover:bg-accent hover:text-bg",
  outline: "bg-transparent text-accent border border-accent/70 hover:bg-accent/10",
  outlineNavy: "bg-transparent text-ink border border-[color:var(--c-rule)] hover:border-accent",
  navy: "bg-primary text-on-dark border border-primary hover:bg-accent hover:text-ink hover:border-accent",
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
