// lib/semantic.ts
// The fixed semantic vocabulary (DG 1 principle 4, DG 3.4). This mapping never
// changes across the product: green healthy, amber watch, coral problem,
// periwinkle pending. Helpers resolve a tone to its CSS variable so components
// never hardcode a hex.
export type Tone = "pos" | "warn" | "neg" | "info" | "accent" | "muted";

export function toneColor(tone: Tone): string {
  return `var(--color-${tone})`;
}

export function toneSoft(tone: Exclude<Tone, "muted">): string {
  return `var(--color-${tone}-soft)`;
}

// Occupancy band -> semantic tone (DG 3.4). At or above 95% healthy, 90 to 95%
// watch, below 90% problem. Input is a fraction.
export function occupancyBand(fraction: number): "pos" | "warn" | "neg" {
  if (fraction >= 0.95) return "pos";
  if (fraction >= 0.9) return "warn";
  return "neg";
}

// The categorical palette, in fixed assignment order (DG 3.5). Used by the
// operating-expense waffle and any breakdown with more than four series.
export const CATEGORICAL: string[] = [
  "var(--cat-1)",
  "var(--cat-2)",
  "var(--cat-3)",
  "var(--cat-4)",
  "var(--cat-5)",
  "var(--cat-6)",
  "var(--cat-7)",
];
