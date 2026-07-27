// lib/cn.ts
// Minimal className combiner. Filters falsy values and joins with spaces.
// Keeps component markup readable without pulling in a dependency.
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
