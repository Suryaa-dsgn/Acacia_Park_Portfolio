// app/fonts.ts
// The type system (DG section 2), updated in the design review: Geist (rounded
// sans) for both headings and data, mono for labels. The Fraunces serif was
// retired, so headings and body now share one family, differentiated by weight
// and size. Wired to CSS variables consumed by tailwind.config and the tokens.
import { IBM_Plex_Mono } from "next/font/google";
import { GeistSans } from "geist/font/sans";

export const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

// GeistSans exposes --font-geist-sans. We alias it to --font-sans in layout.
export const sans = GeistSans;
