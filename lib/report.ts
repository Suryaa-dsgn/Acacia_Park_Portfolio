// lib/report.ts
// Compose helpers for the report surfaces (report spec sections 2, 4, 6, 9).
// All labels are built from structured fields so the output is clean by
// construction, never carrying a source em dash. Client-safe.
import type { ReportMeta, NarrativeStatus } from "./types";
import type { StatusVariant } from "@/components/primitives/StatusTag";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const MONTH_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// Month index (0-11) from an ISO date string "2026-03-31".
export function isoMonthIndex(iso: string): number {
  return Number(iso.slice(5, 7)) - 1;
}

// "January to March 2026" from the period bounds.
export function monthRange(meta: ReportMeta): string {
  const start = MONTHS[isoMonthIndex(meta.periodStart)];
  const end = MONTHS[isoMonthIndex(meta.periodEnd)];
  const year = meta.periodEnd.slice(0, 4);
  return start === end ? `${start} ${year}` : `${start} to ${end} ${year}`;
}

// "Quarterly Operating Report · 2026 · Quarter 1 · January to March 2026".
// Rendered uppercase by the Eyebrow component.
export function periodEyebrow(meta: ReportMeta, lead = "Quarterly Operating Report"): string {
  return `${lead} · ${meta.fiscalYear} · Quarter ${meta.quarterNumber} · ${monthRange(meta)}`;
}

// Statement column labels: current "Q1 2026", prior "Q1 2025".
export function statementColumns(meta: ReportMeta): { current: string; prior: string } {
  return {
    current: `Q${meta.quarterNumber} ${meta.fiscalYear}`,
    prior: `Q${meta.quarterNumber} ${meta.fiscalYear - 1}`,
  };
}

// "03/31/2026" from an ISO date, for the rent-roll as-of eyebrow.
export function usDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${m}/${d}/${y}`;
}

// Narrative status -> StatusTag variant (report spec 9).
export function narrativeStatusVariant(status: NarrativeStatus): StatusVariant {
  switch (status) {
    case "Completed":
      return "completed";
    case "Work in Progress":
      return "in-progress";
    case "Gathering Info":
      return "gathering";
    case "Not Started":
      return "not-started";
  }
}
