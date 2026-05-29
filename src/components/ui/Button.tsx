import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Variant = "gold" | "outline" | "outlineNavy" | "navy";

const base = "btn-ticket";

// "Grand Jubilee" buttons: raffle-ticket shape (semi-circle side notches via
// CSS mask). Variant names kept for back-compat with call sites.
//
// - gold     → gold-filled (the default / "Add Yours" affordance)
// - outline  → parchment-filled with ink frame (secondary)
// - outlineNavy → same outline, used on dark
// - navy     → ink-filled (primary action on light)
const variants: Record<Variant, string> = {
  gold: "",
  outline: "btn-ticket-blue !bg-bg !text-ink",
  outlineNavy: "btn-ticket-blue !bg-bg !text-ink",
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
