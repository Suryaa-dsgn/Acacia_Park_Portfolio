// lib/normalize.ts
// Ingestion normalization (DM section 6). Governed source strings carry em
// dashes, en dashes, and non-breaking spaces. Every free-text field is passed
// through normalizeText on the way in, so no em dash or non-breaking space ever
// reaches the UI. Fixed labels (period strings, section headers) are composed
// from structured fields elsewhere and are clean by construction; this pass is
// the safety net for authored prose (narrative bodies, provenance, identity).
import { normalizeText } from "./format";
import type { QuarterlyReport } from "./types";

function clean(s: string): string {
  return normalizeText(s);
}

// Returns a new report with all display strings normalized. Numbers, enums, and
// structural fields are left untouched.
export function normalizeReport(report: QuarterlyReport): QuarterlyReport {
  const identity =
    report.identity.kind === "property"
      ? {
          ...report.identity,
          tradeName: clean(report.identity.tradeName),
          legalEntity: clean(report.identity.legalEntity),
          manager: clean(report.identity.manager),
          addressLine: clean(report.identity.addressLine),
          cityStateZip: clean(report.identity.cityStateZip),
          submarket: report.identity.submarket
            ? clean(report.identity.submarket)
            : null,
        }
      : {
          ...report.identity,
          label: clean(report.identity.label),
          markets: report.identity.markets.map(clean),
        };

  return {
    ...report,
    identity,
    narrative:
      report.narrative?.map((n) => ({
        ...n,
        title: clean(n.title),
        body: n.body ? clean(n.body) : null,
      })) ?? null,
    provenance: report.provenance.map((p) => ({
      ...p,
      text: clean(p.text),
    })),
  };
}
