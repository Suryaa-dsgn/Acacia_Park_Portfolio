// lib/format.ts
// Shared formatting and normalization utilities (DM section 6, DG 2.4, 10.1).
// Build these once, use them everywhere. Numbers render with tabular-nums at
// the component layer. No formatter ever emits an em dash.

const MULTIPLICATION_SIGN = "×"; // U+00D7, never a lowercase x

const groupInt = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

const groupCents = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// money(1769661.34) -> "$1,769,661". Whole-dollar display, no decimals.
// Negatives render with a leading minus, e.g. "-$411,459", colored at the call
// site with the neg token where the value denotes a loss.
export function money(n: number): string {
  if (!Number.isFinite(n)) return "n/a";
  const sign = n < 0 ? "-" : "";
  return `${sign}$${groupInt.format(Math.abs(Math.round(n)))}`;
}

// moneyExact(1769661.34) -> "$1,769,661.34". Cents preserved, for exports and
// the rare on-screen figure where cents matter.
export function moneyExact(n: number): string {
  if (!Number.isFinite(n)) return "n/a";
  const sign = n < 0 ? "-" : "";
  return `${sign}$${groupCents.format(Math.abs(n))}`;
}

// percent(0.957237) -> "95.7%". Input is a fraction. One decimal.
export function percent(f: number): string {
  if (!Number.isFinite(f)) return "n/a";
  return `${(f * 100).toFixed(1)}%`;
}

// signedPct(0.027) -> "+2.7%", signedPct(-0.318) -> "-31.8%". Input is a fraction.
export function signedPct(f: number): string {
  if (!Number.isFinite(f)) return "n/a";
  const sign = f > 0 ? "+" : f < 0 ? "-" : "";
  return `${sign}${(Math.abs(f) * 100).toFixed(1)}%`;
}

// ratio(0.92) -> "0.92" + the multiplication sign U+00D7, never a lowercase x.
export function ratio(n: number): string {
  if (!Number.isFinite(n)) return "n/a";
  return `${n.toFixed(2)}${MULTIPLICATION_SIGN}`;
}

// count(291) -> "291". Grouped integer.
export function count(n: number): string {
  if (!Number.isFinite(n)) return "n/a";
  return groupInt.format(Math.round(n));
}

// delta(5) -> "+5", delta(-3) -> "-3", delta(0) -> "0". Signed integer change.
export function delta(n: number): string {
  if (!Number.isFinite(n)) return "n/a";
  const rounded = Math.round(n);
  const sign = rounded > 0 ? "+" : "";
  return `${sign}${groupInt.format(rounded)}`;
}

// YoY percent change (DM section 5). Returns null when prior is zero so callers
// render "n/a" rather than dividing by zero.
export function pctChange(current: number, prior: number): number | null {
  if (prior === 0) return null;
  return (current - prior) / prior;
}

// Em-dash and whitespace normalization (DM section 6). Governed source strings
// carry em dashes, en dashes, and non-breaking spaces. Strip them all on
// ingestion so no em dash ever reaches the UI. Prefer composing fixed labels
// from structured fields; use this for free prose (narrative, provenance).
export function normalizeText(s: string): string {
  return s
    .replace(/\s*—\s*/g, ": ") // em dash -> colon + space
    .replace(/–/g, "-") // en dash -> hyphen (ranges)
    .replace(/ /g, " ") // non-breaking space -> space
    .replace(/−/g, "-") // minus sign U+2212 -> hyphen
    .replace(/\s+/g, " ")
    .trim();
}
