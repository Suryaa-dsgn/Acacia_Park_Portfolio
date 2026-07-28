"use client";
// components/shell/AppShell.tsx
// The app frame (IA section 3): header, left navigator, top quarter selector,
// main pane, footer. Server-rendered report content is passed in as children so
// the shell stays a thin interactive wrapper. On wide screens the navigator is a
// fixed sidebar; below the shell breakpoint it collapses to a drawer opened from
// the header (IA section 5).
import { useState } from "react";
import { cn } from "@/lib/cn";
import { BrandLockup } from "./BrandLockup";
import { Footer } from "./Footer";
import { Navigator } from "./Navigator";
import { QuarterSelector } from "./QuarterSelector";
import { ThemeToggle } from "./ThemeToggle";
import { TopNav } from "./TopNav";
import { Icon } from "@/components/primitives/Icon";
import type { PropertyListItem, QuarterId } from "@/lib/types";

export function AppShell({
  properties,
  quarters,
  children,
}: {
  properties: PropertyListItem[];
  quarters: QuarterId[];
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="no-print sticky top-0 z-30 h-14 border-b border-hairline bg-surface">
        <div className="flex h-full items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDrawerOpen(true)}
              className="rounded-sm p-1.5 text-muted hover:text-text-serif shell:hidden"
              aria-label="Open navigation"
            >
              <Icon name="menu" size={20} />
            </button>
            <BrandLockup />
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden shell:block">
              <TopNav quarters={quarters} />
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar navigator (wide screens) */}
        <aside className="no-print sticky top-14 hidden h-[calc(100vh-3.5rem)] w-[304px] shrink-0 border-r border-hairline bg-surface shell:block">
          <Navigator properties={properties} quarters={quarters} />
        </aside>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="no-print sticky top-14 z-20 border-b border-hairline bg-bg/95 px-[clamp(16px,4vw,48px)] py-3 backdrop-blur">
            <QuarterSelector quarters={quarters} properties={properties} />
          </div>
          <main
            id="report"
            tabIndex={-1}
            role="tabpanel"
            aria-label="Quarterly report"
            className="w-full flex-1 px-[clamp(16px,4vw,48px)] py-[clamp(24px,4vh,48px)]"
          >
            {children}
          </main>
        </div>
      </div>

      <Footer />

      {/* Mobile drawer navigator */}
      <div
        className={cn(
          "no-print fixed inset-0 z-40 shell:hidden",
          drawerOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!drawerOpen}
      >
        <div
          onClick={() => setDrawerOpen(false)}
          className={cn(
            "absolute inset-0 bg-black/40 transition-opacity duration-200 motion-reduce:transition-none",
            drawerOpen ? "opacity-100" : "opacity-0",
          )}
        />
        <div
          role="dialog"
          aria-label="Navigation"
          aria-modal={drawerOpen}
          className={cn(
            "absolute left-0 top-0 h-full w-[304px] max-w-[85vw] border-r border-hairline bg-surface transition-transform duration-200 ease-out motion-reduce:transition-none",
            drawerOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex h-14 items-center justify-between border-b border-hairline px-4">
            <BrandLockup />
            <button
              onClick={() => setDrawerOpen(false)}
              className="rounded-sm p-1.5 text-muted hover:text-text-serif"
              aria-label="Close navigation"
            >
              <Icon name="close" size={20} />
            </button>
          </div>
          <div className="h-[calc(100%-3.5rem)]">
            <Navigator
              properties={properties}
              quarters={quarters}
              onSelect={() => setDrawerOpen(false)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
