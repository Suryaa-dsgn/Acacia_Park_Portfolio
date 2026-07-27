import { describe, it, expect } from "vitest";
import { normalizeReport } from "./normalize";
import type { QuarterlyReport } from "./types";

// A deliberately dirty report, simulating governed source strings that carry em
// dashes, en dashes, and non-breaking spaces. normalizeReport must strip them
// all so nothing unclean reaches the UI (DM section 6). Fixtures on disk are
// already clean; this proves the ingestion safety net.
function dirtyReport(): QuarterlyReport {
  const line = (key: string, label: string) => ({
    key,
    label,
    ptdCurrent: 100,
    ptdPrior: 90,
    ytdCurrent: 100,
    ytdPrior: 90,
    favorability: "higherIsBetter" as const,
  });
  return {
    meta: {
      quarter: "2026-q1",
      quarterLabel: "Q1'26",
      fiscalYear: 2026,
      quarterNumber: 1,
      periodStart: "2026-01-01",
      periodEnd: "2026-03-31",
      priorPeriodStart: "2025-01-01",
      priorPeriodEnd: "2025-03-31",
      accountingBasis: "Cash",
      rentRollAsOf: "2026-03-31",
      generatedAt: "2026-04-15T09:00:00Z",
    },
    identity: {
      kind: "property",
      tradeName: "Universe at Acacia",
      legalEntity: "Universe at Acacia — DE, LLC",
      manager: "Meridian Residential",
      addressLine: "5280 N Little Mountain Dr",
      cityStateZip: "San Bernardino, CA 92407",
      submarket: "Inland Empire",
      units: 304,
      totalSqFt: 258400,
    },
    operatingStatement: {
      income: [line("rentalIncome", "Rental Income")],
      totalIncome: { ...line("totalIncome", "Total Income"), isSubtotal: true },
      expenses: [line("utilities", "Utilities")],
      totalOperatingExpenses: {
        ...line("totalOperatingExpenses", "Total Operating Expenses"),
        isSubtotal: true,
        favorability: "lowerIsBetter",
      },
      netOperatingIncome: {
        ...line("netOperatingIncome", "Net Operating Income"),
        isResult: true,
      },
    },
    rentRoll: {
      asOf: "2026-03-31",
      totalUnits: 304,
      occupiedUnits: 291,
      vacantUnits: 13,
      physicalOccupancy: 0.957237,
      totalSqFt: 258400,
      avgUnitSqFt: 850,
      avgUnitRent: 1811,
      avgOccupiedUnitRent: 1952.81,
      avgResidentRent: 1876.95,
      totalMarketRent: 593657,
      totalInPlaceRent: 550544,
      economicOccupancy: 0.927377,
    },
    leasing: {
      moveIns: 28,
      moveOuts: 23,
      netAbsorption: 5,
      noticesToVacate: 22,
      unitsRented: 57,
      renewals: 48,
      evictions: 2,
    },
    occupancySeries: {
      currentYear: 2026,
      priorYear: 2025,
      current: [0.9312, null],
      prior: [0.921, 0.925],
    },
    narrative: [
      {
        key: "marketCommentary",
        title: "Market Commentary",
        body: "Demand held firm, January–March, though concessions persisted — a watch item.",
        status: "Completed",
      },
    ],
    images: null,
    provenance: [
      { text: "Governed from Yardi Voyager — 2026 Q1 export." },
    ],
    scope: { kind: "property", propertyId: "acacia" },
  };
}

function collectStrings(report: QuarterlyReport): string {
  const parts: string[] = [];
  if (report.identity.kind === "property") {
    parts.push(
      report.identity.tradeName,
      report.identity.legalEntity,
      report.identity.submarket ?? "",
    );
  }
  for (const n of report.narrative ?? []) parts.push(n.title, n.body ?? "");
  for (const p of report.provenance) parts.push(p.text);
  return parts.join(" | ");
}

describe("normalizeReport strips em dashes, en dashes, and non-breaking spaces", () => {
  it("leaves no em dash or non-breaking space in any display string", () => {
    const out = normalizeReport(dirtyReport());
    const joined = collectStrings(out);
    expect(joined.includes("—")).toBe(false); // em dash
    expect(joined.includes(" ")).toBe(false); // non-breaking space
  });

  it("converts an em dash to a colon and an en dash to a hyphen", () => {
    const out = normalizeReport(dirtyReport());
    if (out.identity.kind === "property") {
      expect(out.identity.legalEntity).toBe("Universe at Acacia: DE, LLC");
      expect(out.identity.submarket).toBe("Inland Empire");
    }
    expect(out.narrative?.[0].body).toContain("January-March");
  });

  it("preserves numeric fields untouched", () => {
    const out = normalizeReport(dirtyReport());
    expect(out.operatingStatement.totalIncome.ptdCurrent).toBe(100);
    expect(out.rentRoll.physicalOccupancy).toBe(0.957237);
  });
});
