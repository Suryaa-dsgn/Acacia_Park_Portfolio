"use client";
// components/primitives/SegmentedToggle.tsx
// Generic segmented control (DG 9.5, 9.8). Mono labels in a pill container, the
// active indicator slides between segments with springUI (interruptible), and
// the slide is disabled under reduced motion. Used for sort controls, range
// pickers (3M / 6M / 12M), and scope switches.
import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";
import { springUI } from "@/lib/motion";

export interface Segment<T extends string> {
  value: T;
  label: React.ReactNode;
}

export function SegmentedToggle<T extends string>({
  segments,
  value,
  onChange,
  ariaLabel,
  layoutId,
  className,
}: {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  layoutId?: string;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const autoId = useId();
  const activeLayoutId = layoutId ?? autoId;
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center gap-1 rounded-pill border border-hairline bg-panel p-1",
        className,
      )}
    >
      {segments.map((s) => {
        const active = s.value === value;
        return (
          <button
            key={s.value}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(s.value)}
            className="relative rounded-pill px-3 py-1 font-mono text-[0.6875rem] uppercase tracking-[0.1em] transition-colors"
            style={{
              color: active
                ? "var(--color-text-serif)"
                : "var(--color-text-muted)",
            }}
          >
            {active && (
              <motion.span
                layoutId={activeLayoutId}
                className="absolute inset-0 rounded-pill"
                style={{ background: "var(--color-accent-soft)" }}
                transition={reduced ? { duration: 0 } : springUI}
              />
            )}
            <span className="relative z-10">{s.label}</span>
          </button>
        );
      })}
    </div>
  );
}
