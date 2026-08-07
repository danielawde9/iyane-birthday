import { cn } from "@/lib/cn";

/**
 * Shared pieces for the three home-hero candidates.
 *
 * Every file under /art is a real alpha WebP, so none of this needs
 * `mix-blend-mode`. That is deliberate — see public/art/CREDITS.md. It means a
 * painted layer can sit over parchment, over a photograph, or over the red band
 * without changing anything, and none of it can be broken by an ancestor that
 * happens to create a stacking context.
 */

export const ART = {
  tent: "/art/tent.webp",
  badge: "/art/badge.webp",
  bunting: "/art/bunting.webp",
  balloons: ["/art/balloon-1.webp", "/art/balloon-2.webp", "/art/balloon-3.webp"],
} as const;

/** A decorative painted layer. Always `aria-hidden` — it carries no meaning. */
function PaintedLayer({
  src,
  className,
  style,
  soft = false,
}: {
  src: string;
  className?: string;
  style?: React.CSSProperties;
  soft?: boolean;
}) {
  return (
     
    <img
      src={src}
      alt=""
      aria-hidden="true"
      draggable={false}
      className={cn("art pointer-events-none absolute", soft && "art-soft", className)}
      style={style}
    />
  );
}

/**
 * A horizontal run of bunting.
 *
 * Painted as a repeating background rather than a single stretched <img>: the
 * artwork's twine meets the left and right edges at the same height, so it tiles
 * seamlessly, and tiling keeps the flags at a constant size instead of scaling
 * them up with the viewport. A 3000px-wide monitor gets more flags, not
 * comically large ones.
 */
export function BuntingStrip({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute left-0 w-full", className)}
      style={{
        backgroundImage: `url(${ART.bunting})`,
        backgroundRepeat: "repeat-x",
        backgroundSize: "auto 100%",
        backgroundPosition: "center top",
      }}
    />
  );
}

/**
 * The three balloons drifting in the upper sky, positioned as in the film.
 * Each gets its own animation track and delay so they don't bob in lockstep;
 * `prefers-reduced-motion` stops all of them (see globals.css).
 */
const BALLOON_LAYOUT = [
  { className: "right-[5%] top-[10%] w-14 sm:w-20 lg:w-24", drift: "art-drift", delay: "0s" },
  { className: "right-[18%] top-[19%] w-10 sm:w-14 lg:w-16", drift: "art-drift-slow", delay: "-4s" },
  { className: "left-[7%] top-[16%] w-8 sm:w-11 lg:w-14", drift: "art-drift", delay: "-7s" },
] as const;

export function FloatingBalloons({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0", className)}>
      {BALLOON_LAYOUT.map((b, i) => (
        <PaintedLayer
          key={ART.balloons[i]}
          src={ART.balloons[i]!}
          className={cn(b.className, b.drift)}
          style={{ ["--drift-delay" as string]: b.delay }}
        />
      ))}
    </div>
  );
}

/**
 * The oval marquee sign. The artwork is deliberately BLANK and the wording is
 * real HTML on top of it, because the copy changes per year and baked lettering
 * would be invisible to screen readers, to search, and to the OG card.
 *
 * The text box is inset to the painted oval's flat interior; `cqw` units size it
 * against the sign itself rather than the viewport, so the lockup holds together
 * at every width without a pile of breakpoints.
 */
export function MarqueeSign({
  lead,
  title,
  className,
}: {
  lead: string;
  title: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)} style={{ containerType: "inline-size" }}>
      <img src={ART.badge} alt="" aria-hidden="true" draggable={false} className="art w-full" />
      <div className="absolute inset-0 flex flex-col items-center justify-center px-[16%] text-center">
        <p
          className="font-display uppercase leading-none text-primary-deep"
          style={{ fontSize: "clamp(0.5rem, 4.4cqw, 2rem)", letterSpacing: "0.06em" }}
        >
          {lead}
        </p>
        <p
          className="font-display uppercase leading-[0.95] text-primary"
          style={{ fontSize: "clamp(0.9rem, 9.4cqw, 4.4rem)", letterSpacing: "0.01em" }}
        >
          {title}
        </p>
      </div>
    </div>
  );
}
