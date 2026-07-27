"use client";
// components/table/SortControl.tsx
// Segmented mono pill control that sits above a DataTable (DG 9.4). Each pill is
// a sort key; the active pill carries a soft accent fill and a direction glyph.
// Re-selecting the active key flips the direction. The active indicator slides
// with springUI, disabled under reduced motion.
import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";
import { springUI } from "@/lib/motion";

export type SortDir = "asc" | "desc";

export interface SortKey {
  key: string;
  label: string;
}

export function SortControl({
  keys,
  active,
  dir,
  onChange,
  layoutId,
  className,
}: {
  keys: SortKey[];
  active: string;
  dir: SortDir;
  onChange: (key: string) => void;
  layoutId?: string;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const autoId = useId();
  const activeLayoutId = layoutId ?? autoId;
  return (
    <div
      role="group"
      aria-label="Sort"
      className={cn(
        "inline-flex items-center gap-1 rounded-pill border border-hairline bg-panel p-1",
        className,
      )}
    >
      {keys.map((k) => {
        const isActive = k.key === active;
        return (
          <button
            key={k.key}
            onClick={() => onChange(k.key)}
            aria-pressed={isActive}
            className="relative inline-flex items-center gap-1 rounded-pill px-3 py-1 font-mono text-[0.6875rem] uppercase tracking-[0.1em] transition-colors"
            style={{
              color: isActive
                ? "var(--color-pos)"
                : "var(--color-text-muted)",
            }}
          >
            {isActive && (
              <motion.span
                layoutId={activeLayoutId}
                className="absolute inset-0 rounded-pill"
                style={{ background: "var(--color-pos-soft)" }}
                transition={reduced ? { duration: 0 } : springUI}
              />
            )}
            <span className="relative z-10">{k.label}</span>
            {isActive && (
              <span className="relative z-10" aria-hidden>
                {dir === "desc" ? "▼" : "▲"}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
