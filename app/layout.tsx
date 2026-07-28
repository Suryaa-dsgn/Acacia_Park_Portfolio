import type { Metadata } from "next";
import { ThemeScript } from "@/components/shell/ThemeScript";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quarterly Report",
  description:
    "Quarterly operating reports for a multifamily real-estate portfolio.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className=""
    >
      <head>
        <ThemeScript />
      </head>
      <body>
        <a href="#report" className="skip-link">
          Skip to report
        </a>
        {children}
      </body>
    </html>
  );
}
