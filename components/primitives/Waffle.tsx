"use client";
// components/primitives/Waffle.tsx
// A waffle grid of bricks (DG 8.1, report spec 5.2). Each brick is a share of a
// whole (for example a slice of total operating expense), colored by category
// using the categorical palette in fixed order. Cell counts per segment use
// largest-remainder rounding so they always sum to the grid total. Cells reveal
// with a light per-cell opacity stagger via CSS, disabled under reduced motion.
import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";

export interface WaffleSegment {
  label: string;
  value: number;
  color: string; // CSS color or var()
}

// Distribute totalCells across segments proportional to value, summing exactly.
function allocateCells(values: number[], totalCells: number): number[] {
  const total = values.reduce((a, b) => a + b, 0);
  if (total <= 0) return values.map(() => 0);
  const raw = values.map((v) => (v / total) * totalCells);
  const floors = raw.map(Math.floor);
  let remainder = totalCells - floors.reduce((a, b) => a + b, 0);
  const order = raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac);
  const out = [...floors];
  for (let k = 0; k < order.length && remainder > 0; k++, remainder--) {
    out[order[k].i] += 1;
  }
  return out;
}

export function Waffle({
  segments,
  columns = 10,
  rows = 10,
  cellSize = 16,
  className,
}: {
  segments: WaffleSegment[];
  columns?: number;
  rows?: number;
  cellSize?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const totalCells = columns * rows;
  const counts = allocateCells(
    segments.map((s) => s.value),
    totalCells,
  );

  // Expand into a flat, ordered color list, one entry per cell.
  const cells: string[] = [];
  counts.forEach((c, si) => {
    for (let k = 0; k < c; k++) cells.push(segments[si].color);
  });
  while (cells.length < totalCells) cells.push("var(--color-border)");

  const step = Math.min(0.006, 0.5 / totalCells);

  return (
    <div
      className={cn("grid w-max", className)}
      style={{
        gridTemplateColumns: `repeat(${columns}, ${cellSize}px)`,
        gap: 3,
      }}
      role="img"
      aria-label={segments
        .map((s) => `${s.label}: ${s.value}`)
        .join(", ")}
    >
      {cells.map((color, i) => (
        <span
          key={i}
          className="rounded-xs"
          style={{
            width: cellSize,
            height: cellSize,
            background: color,
            opacity: mounted || reduced ? 1 : 0,
            transition: reduced
              ? "none"
              : `opacity 180ms ease-out ${i * step}s`,
          }}
        />
      ))}
    </div>
  );
}
