// app/fonts.ts
// The tri-family type system (DG section 2). Three families, three strict roles:
// serif for display, mono for labels, sans for all data. Wired to CSS variables
// consumed by tailwind.config and the token layer.
import { Fraunces, IBM_Plex_Mono } from "next/font/google";
import { GeistSans } from "geist/font/sans";

export const serif = Fraunces({
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
  variable: "--font-serif",
  display: "swap",
});

export const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

// GeistSans exposes --font-geist-sans. We alias it to --font-sans in layout.
export const sans = GeistSans;
