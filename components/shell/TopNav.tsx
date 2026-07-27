"use client";
// components/shell/TopNav.tsx
// Top-level section nav (Portfolio, Signal, Compare). Additive to the existing
// shell header; the left navigator and quarter selector are unchanged. Links
// carry the current quarter so switching sections keeps the period. The active
// section reads via the inverted-weight label, matching the quiet mono chrome.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { parseRoute, holdingsHref, signalHref, compareHref } from "@/lib/nav";
import type { QuarterId } from "@/lib/types";

export function TopNav({ quarters }: { quarters: QuarterId[] }) {
  const pathname = usePathname();
  const route = parseRoute(pathname);
  const latest = quarters[quarters.length - 1];
  const quarter = route.quarter ?? latest;
  // Portfolio covers both the holdings roll-up and a drilled-in property report.
  const section = route.section === "property" ? "holdings" : route.section;

  const items: { key: string; label: string; href: string }[] = [
    { key: "holdings", label: "Portfolio", href: holdingsHref(quarter) },
    { key: "signal", label: "Signal", href: signalHref(quarter) },
    { key: "compare", label: "Compare", href: compareHref(quarter) },
  ];

  return (
    <nav aria-label="Sections" className="flex items-center gap-1">
      {items.map((item) => {
        const active = section === item.key;
        return (
          <Link
            key={item.key}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-sm px-2.5 py-1.5 font-mono text-caption uppercase tracking-[0.08em] transition-colors",
              active
                ? "text-text-serif"
                : "text-muted hover:text-text-serif",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
