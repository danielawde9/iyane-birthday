import type { Metadata } from "next";
import { Bevan, Lora, Special_Elite, Yellowtail, Bagel_Fat_One, Quicksand, Caveat } from "next/font/google";
import "./globals.css";
import { getActiveTheme } from "@/lib/active-theme";
import { themeToCssVars } from "@/themes";
import { MusicPlayerProvider } from "@/components/site/MusicPlayerProvider";
import { MusicToggle } from "@/components/site/MusicToggle";

/*
 * Every registered theme's fonts are declared here, but `preload: false` on all
 * of them is deliberate. next/font's default is to emit a <link rel="preload">
 * for every declared family on every page whether or not it renders — and the
 * active theme is only resolved per-request further down this file, so there is
 * no way to preload conditionally through the next/font API. Declaring them all
 * costs nothing extra at runtime: a browser only downloads an @font-face source
 * that the rendered CSS actually references, so a page still fetches just the
 * three or four faces its theme names. `display: "swap"` covers the gap.
 */

// Year 1 — the watercolor circus.
const bevan = Bevan({ subsets: ["latin"], weight: "400", variable: "--font-bevan", display: "swap", preload: false });
const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-lora",
  display: "swap",
  preload: false,
});
const elite = Special_Elite({ subsets: ["latin"], weight: "400", variable: "--font-elite", display: "swap", preload: false });
const yellowtail = Yellowtail({ subsets: ["latin"], weight: "400", variable: "--font-yellowtail", display: "swap", preload: false });

// Tiny Astronaut (Year 2 / playful space mission) fonts.
const bagel = Bagel_Fat_One({ subsets: ["latin"], weight: "400", variable: "--font-bagel", display: "swap", preload: false });
const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-quicksand",
  display: "swap",
  preload: false,
});
const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-caveat",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Iyane — Gallery & Slideshow",
  description:
    "Browse the gallery, leave a wish in the guestbook, and add your photographs to the keepsake.",
  openGraph: {
    title: "Iyane",
    description: "A shared keepsake placed by every guest.",
    type: "website",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = await getActiveTheme();
  const themeVars = themeToCssVars(theme) as React.CSSProperties;
  const fontVars = [bevan, lora, elite, yellowtail, bagel, quicksand, caveat].map((f) => f.variable).join(" ");
  return (
    <html
      lang="en"
      className={`${fontVars} h-full antialiased`}
      style={themeVars}
      data-theme={theme.slug}
    >
      <body className="min-h-full flex flex-col">
        <MusicPlayerProvider src="/audio/grand-jubilee.mp3">
          {children}
          <MusicToggle />
        </MusicPlayerProvider>
      </body>
    </html>
  );
}
