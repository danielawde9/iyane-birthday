import type { Metadata } from "next";
import { Cormorant_Garamond, Cormorant_SC, Italianno } from "next/font/google";
import "./globals.css";
import { getActiveTheme } from "@/lib/active-theme";
import { themeToCssVars } from "@/themes";

// The "Iyane keepsake" type system: an engraved serif (Cormorant Garamond, with
// italics for the editorial voice), small-caps (Cormorant SC) for tracked labels,
// and a flowing script (Italianno) for the name. Self-hosted via next/font.
const serif = Cormorant_Garamond({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});
const serifSc = Cormorant_SC({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-cormorant-sc",
  display: "swap",
});
const script = Italianno({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-italianno",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Iyane · Year One — Gallery & Slideshow",
  description:
    "A keepsake for Iyane's first year. A page written by the room — browse the gallery, leave a line in the guestbook, and add your photographs from the day.",
  openGraph: {
    title: "Iyane · Year One",
    description: "A shared keepsake — every photograph here was placed by a guest.",
    type: "website",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = await getActiveTheme();
  const themeVars = themeToCssVars(theme) as React.CSSProperties;
  return (
    <html
      lang="en"
      className={`${serif.variable} ${serifSc.variable} ${script.variable} h-full antialiased`}
      style={themeVars}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
