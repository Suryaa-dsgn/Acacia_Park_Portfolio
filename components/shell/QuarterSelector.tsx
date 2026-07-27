"use client";
// components/shell/QuarterSelector.tsx
// The top quarter selector (IA 1.2). Chips oldest to newest, only the quarters
// that exist (never padded to five). The active chip reads as the selected one
// via the inverted fill; the indicator slides with springUI (interruptible),
// disabled under reduced motion. A quarter with no governed report for the
// current scope is disabled with a tooltip. Rendered as a tablist controlling
// the report tabpanel; left/right arrows move between enabled chips.
import { useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";
import { parseRoute, hrefForScope } from "@/lib/nav";
import { quarterShortLabel } from "@/lib/quarter";
import type { PropertyListItem, QuarterId } from "@/lib/types";

export function QuarterSelector({
  quarters,
  properties,
}: {
  quarters: QuarterId[];
  properties: PropertyListItem[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const { scope, quarter } = parseRoute(pathname);
  const chipRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Which quarters have a governed report for the current scope.
  const available = new Set<QuarterId>();
  if (scope?.kind === "property") {
    const p = properties.find((x) => x.propertyId === scope.propertyId);
    p?.availableQuarters.forEach((q) => available.add(q));
  } else {
    // holding: any quarter at least one property reports
    for (const p of properties)
      p.availableQuarters.forEach((q) => available.add(q));
  }

  function go(q: QuarterId) {
    if (!scope || !available.has(q)) return;
    router.push(hrefForScope(scope, q));
  }

  function onKeyDown(e: React.KeyboardEvent, index: number) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const dir = e.key === "ArrowRight" ? 1 : -1;
    for (let i = index + dir; i >= 0 && i < quarters.length; i += dir) {
      if (available.has(quarters[i])) {
        chipRefs.current[i]?.focus();
        return;
      }
    }
  }

  return (
    <div
      role="tablist"
      aria-label="Quarter"
      className="flex items-center gap-1"
    >
      {quarters.map((q, i) => {
        const active = q === quarter;
        const enabled = available.has(q);
        return (
          <button
            key={q}
            ref={(el) => {
              chipRefs.current[i] = el;
            }}
            role="tab"
            aria-selected={active}
            aria-disabled={!enabled}
            tabIndex={active ? 0 : -1}
            disabled={!enabled}
            title={enabled ? undefined : "No governed report for this quarter"}
            onClick={() => go(q)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              "relative rounded-sm px-3.5 py-1.5 font-mono text-caption uppercase tracking-[0.08em] transition-colors",
              !enabled && "cursor-not-allowed text-faint opacity-60",
              enabled && !active && "text-muted hover:text-text-serif",
            )}
            style={active ? { color: "var(--color-invert-ink)" } : undefined}
          >
            {active && (
              <motion.span
                layoutId="quarter-active"
                className="absolute inset-0 rounded-sm"
                style={{ background: "var(--color-invert-bg)" }}
                transition={reduced ? { duration: 0 } : { type: "spring", bounce: 0, duration: 0.35 }}
              />
            )}
            <span className="relative z-10">{quarterShortLabel(q)}</span>
          </button>
        );
      })}
    </div>
  );
}
