// lib/quarter.ts
// Quarter slug and label helpers (IA section 2). The URL carries the slug
// ("2026-q1"); the UI derives the human short label ("Q1'26"). Client-safe, no
// data-source access.
import type { QuarterId } from "./types";

const SLUG_RE = /^(\d{4})-q([1-4])$/;

export function isQuarterSlug(slug: string): boolean {
  return SLUG_RE.test(slug);
}

// "2026-q1" -> "Q1'26"
export function quarterShortLabel(slug: QuarterId): string {
  const m = SLUG_RE.exec(slug);
  if (!m) return slug;
  const [, year, q] = m;
  return `Q${q}'${year.slice(2)}`;
}

// "2026-q1" -> { year: 2026, quarter: 1 }
export function parseQuarter(slug: QuarterId): { year: number; quarter: number } | null {
  const m = SLUG_RE.exec(slug);
  if (!m) return null;
  return { year: Number(m[1]), quarter: Number(m[2]) };
}
