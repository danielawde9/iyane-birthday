"use client";

import Link from "next/link";
import { ART, BuntingStrip, FloatingBalloons, MarqueeSign } from "./art";

/**
 * The home page: the invitation's poster, and nothing else.
 *
 * The invitation's first scene, rebuilt in the browser: parchment ground,
 * drifting balloons, bunting, the oval marquee, and the big top anchored to the
 * bottom of the viewport.
 *
 * The whole composition is sized to fit one screen — a column with the tent
 * taking whatever height is left over — so the tent is visible on arrival rather
 * than pushed below the fold on short laptops. That makes the home page a single
 * poster whose job is to send you on: the live slideshow and the photo wall both
 * live on /gallery now.
 */
export function HeroPoster() {
  return (
    <section
      aria-label="Iyane's first birthday"
      className="relative -mt-6 flex h-[calc(100svh-78px)] w-full flex-col overflow-hidden sm:h-[calc(100svh-88px)]"
      style={{ minHeight: "34rem" }}
    >
      <FloatingBalloons />

      {/* Bunting hangs across the very top, above the sign — as in the film. */}
      <BuntingStrip className="top-12 h-24 sm:top-14 sm:h-32" />

      <div className="relative z-10 flex shrink-0 flex-col items-center px-4 pt-[7svh] sm:px-8">
        <MarqueeSign
          lead="Iyane's First"
          title="Birthday"
          className="w-full max-w-[22rem] sm:max-w-md lg:max-w-lg"
        />

        <p className="script mt-3 text-center text-2xl text-primary-deep sm:mt-4 sm:text-3xl">
          The greatest little show on earth
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <Link href="/gallery" className="btn-ticket">
            See the photos
          </Link>
          <Link href="/upload" className="btn-ticket btn-ticket-red">
            Add yours
          </Link>
        </div>
      </div>

      {/* The tent fills the remaining height and sits on the bottom edge.
            `object-contain` + `object-bottom` means a short viewport crops
            nothing — the tent just gets smaller. */}
      <div className="relative z-0 mt-auto min-h-0 w-full flex-1 pt-4">
        <img
          src={ART.tent}
          alt="A watercolor circus big top"
          draggable={false}
          className="art mx-auto h-full w-full max-w-5xl object-contain object-bottom"
        />
      </div>
    </section>
  );
}
