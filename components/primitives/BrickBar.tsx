"use client";
// components/primitives/BrickBar.tsx
// Horizontal brick bar (DG 8.2). Each square is a quantum of value, filled left
// to right against the row max, with the unfilled remainder shown as a faint
// track. The whole row is colored by its semantic tone (an occupancy band, a
// funnel stage) so a scan of a list reads health and magnitude at once. Bricks
// reveal with a small capped stagger; reduced motion collapses this to opacity.
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";
import { toneColor, type Tone } from "@/lib/semantic";

const CELLS_DEFAULT = 28;

export function BrickBar({
  fraction,
  tone,
  label,
  value,
  cells = CELLS_DEFAULT,
  cellSize = 12,
  className,
}: {
  fraction: number; // 0..1, this row's value against the list max
  tone: Tone;
  label?: React.ReactNode;
  value?: React.ReactNode;
  cells?: number;
  cellSize?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const clamped = Math.max(0, Math.min(1, fraction));
  // Always show at least one filled cell for a non-zero value, so a tiny bar is
  // still visible rather than reading as empty.
  const filled =
    clamped === 0 ? 0 : Math.max(1, Math.round(clamped * cells));
  const fill = toneColor(tone);

  // Cap total stagger so a long bar does not crawl in (DG 7.3).
  const step = Math.min(0.02, 0.35 / cells);

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {label != null && (
        <span className="w-40 shrink-0 truncate font-sans text-body text-ink">
          {label}
        </span>
      )}
      <motion.div
        className="flex shrink-0 items-center"
        style={{ gap: 3 }}
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: step } } }}
        aria-hidden
      >
        {Array.from({ length: cells }).map((_, i) => {
          const isFilled = i < filled;
          return (
            <motion.span
              key={i}
              className="rounded-xs"
              style={{
                width: cellSize,
                height: cellSize,
                background: isFilled ? fill : "var(--color-border)",
              }}
              variants={
                reduced
                  ? { hidden: { opacity: 0 }, show: { opacity: 1 } }
                  : {
                      hidden: { opacity: 0, scale: 0.9 },
                      show: { opacity: 1, scale: 1 },
                    }
              }
              transition={{ duration: 0.18, ease: "easeOut" }}
            />
          );
        })}
      </motion.div>
      {value != null && (
        <span className="w-24 shrink-0 text-right font-sans text-data tabular text-ink">
          {value}
        </span>
      )}
    </div>
  );
}
