import type { Metadata } from "next";
import { Arimo, Libre_Caslon_Text, Space_Mono, Bagel_Fat_One, Quicksand, Caveat } from "next/font/google";
import "./globals.css";
import { getActiveTheme } from "@/lib/active-theme";
import { themeToCssVars } from "@/themes";

// Default Grand Jubilee fonts.
const arimo = Arimo({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-arimo",
  display: "swap",
});
const caslon = Libre_Caslon_Text({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-caslon",
  display: "swap",
});
const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-spacemono",
  display: "swap",
});

// Tiny Astronaut (Year 2 / playful space mission) fonts.
const bagel = Bagel_Fat_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bagel",
  display: "swap",
});
const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-quicksand",
  display: "swap",
});
const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-caveat",
  display: "swap",
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
  const fontVars = [arimo, caslon, spaceMono, bagel, quicksand, caveat].map((f) => f.variable).join(" ");
  return (
    <html
      lang="en"
      className={`${fontVars} h-full antialiased`}
      style={themeVars}
      data-theme={theme.slug}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
