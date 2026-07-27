import { describe, it, expect, beforeAll } from "vitest";
import { FixtureDataSource } from "./dataSource";
import { aggregateHolding } from "./aggregate";
import type { QuarterlyReport, PropertyListItem } from "./types";

const ds = new FixtureDataSource();
const EPS = 0.02; // rounding tolerance in dollars

let properties: PropertyListItem[];

beforeAll(async () => {
  properties = await ds.listProperties();
});

function sumLines(lines: { ptdCurrent: number }[]) {
  return lines.reduce((a, l) => a + l.ptdCurrent, 0);
}

describe("fixtures load and satisfy the contract", () => {
  it("lists the expected properties", async () => {
    expect(properties.length).toBe(5);
    expect(properties.map((p) => p.propertyId)).toContain("acacia");
  });

  it("returns a typed report for every property and available quarter", async () => {
    for (const p of properties) {
      for (const q of p.availableQuarters) {
        const r = await ds.getReport(
          { kind: "property", propertyId: p.propertyId },
          q,
        );
        expect(r, `${p.propertyId}/${q}`).not.toBeNull();
        const report = r as QuarterlyReport;
        expect(report.scope).toEqual({
          kind: "property",
          propertyId: p.propertyId,
        });
        expect(report.identity.kind).toBe("property");
      }
    }
  });

  it("returns null for a quarter a property does not report", async () => {
    // elmgrove has only 2026-q1
    const r = await ds.getReport(
      { kind: "property", propertyId: "elmgrove" },
      "2025-q4",
    );
    expect(r).toBeNull();
  });
});

describe("operating-statement invariants hold for every fixture", () => {
  it("totals equal the sum of their lines, NOI equals income minus opex", async () => {
    for (const p of properties) {
      for (const q of p.availableQuarters) {
        const r = (await ds.getReport(
          { kind: "property", propertyId: p.propertyId },
          q,
        )) as QuarterlyReport;
        const os = r.operatingStatement;
        expect(Math.abs(sumLines(os.income) - os.totalIncome.ptdCurrent)).toBeLessThan(EPS);
        expect(Math.abs(sumLines(os.expenses) - os.totalOperatingExpenses.ptdCurrent)).toBeLessThan(EPS);
        const noi = os.totalIncome.ptdCurrent - os.totalOperatingExpenses.ptdCurrent;
        expect(Math.abs(noi - os.netOperatingIncome.ptdCurrent)).toBeLessThan(EPS);
      }
    }
  });

  it("rent-roll and leasing derived fields are consistent", async () => {
    for (const p of properties) {
      for (const q of p.availableQuarters) {
        const r = (await ds.getReport(
          { kind: "property", propertyId: p.propertyId },
          q,
        )) as QuarterlyReport;
        const rr = r.rentRoll;
        expect(rr.occupiedUnits + rr.vacantUnits).toBe(rr.totalUnits);
        expect(Math.abs(rr.physicalOccupancy - rr.occupiedUnits / rr.totalUnits)).toBeLessThan(1e-4);
        expect(Math.abs(rr.economicOccupancy - rr.totalInPlaceRent / rr.totalMarketRent)).toBeLessThan(1e-4);
        expect(rr.physicalOccupancy).toBeGreaterThan(0);
        expect(rr.physicalOccupancy).toBeLessThanOrEqual(1);
        expect(r.leasing.netAbsorption).toBe(r.leasing.moveIns - r.leasing.moveOuts);
      }
    }
  });
});

describe("Acacia Q1 2026 matches the governed sample exactly", () => {
  it("carries the governed headline figures", async () => {
    const r = (await ds.getReport(
      { kind: "property", propertyId: "acacia" },
      "2026-q1",
    )) as QuarterlyReport;
    const os = r.operatingStatement;
    expect(os.totalIncome.ptdCurrent).toBe(1769661.34);
    expect(os.totalIncome.ptdPrior).toBe(1669096.26);
    expect(os.totalOperatingExpenses.ptdCurrent).toBe(1219456.58);
    expect(os.totalOperatingExpenses.ptdPrior).toBe(862475.49);
    expect(os.netOperatingIncome.ptdCurrent).toBe(550204.76);
    expect(os.netOperatingIncome.ptdPrior).toBe(806620.77);
    // Q1: PTD equals YTD
    expect(os.totalIncome.ytdCurrent).toBe(os.totalIncome.ptdCurrent);
  });
});

describe("holding roll-up (DM 4.1) matches hand math over the property fixtures", () => {
  async function propertyReportsFor(quarter: string) {
    const reports: QuarterlyReport[] = [];
    for (const p of properties) {
      if (!p.availableQuarters.includes(quarter)) continue;
      const r = await ds.getReport(
        { kind: "property", propertyId: p.propertyId },
        quarter,
      );
      if (r) reports.push(r);
    }
    return reports;
  }

  it("sums NOI and derives occupancy from rolled-up totals for 2026-q1", async () => {
    const reports = await propertyReportsFor("2026-q1");
    expect(reports.length).toBe(5);
    const holding = (await ds.getReport({ kind: "holding" }, "2026-q1")) as QuarterlyReport;

    const expectedNoi = reports.reduce(
      (a, r) => a + r.operatingStatement.netOperatingIncome.ptdCurrent,
      0,
    );
    expect(Math.abs(holding.operatingStatement.netOperatingIncome.ptdCurrent - expectedNoi)).toBeLessThan(EPS);

    const occ = reports.reduce((a, r) => a + r.rentRoll.occupiedUnits, 0);
    const units = reports.reduce((a, r) => a + r.rentRoll.totalUnits, 0);
    expect(Math.abs(holding.rentRoll.physicalOccupancy - occ / units)).toBeLessThan(1e-6);

    const inPlace = reports.reduce((a, r) => a + r.rentRoll.totalInPlaceRent, 0);
    const market = reports.reduce((a, r) => a + r.rentRoll.totalMarketRent, 0);
    expect(Math.abs(holding.rentRoll.economicOccupancy - inPlace / market)).toBeLessThan(1e-6);

    expect(holding.identity.kind).toBe("holding");
    if (holding.identity.kind === "holding") {
      expect(holding.identity.propertyCount).toBe(5);
      expect(holding.identity.totalUnits).toBe(units);
    }
  });

  it("unit-weights the monthly occupancy series", async () => {
    const reports = await propertyReportsFor("2026-q1");
    const holding = (await ds.getReport({ kind: "holding" }, "2026-q1")) as QuarterlyReport;
    // January (index 0), all properties report
    let weighted = 0;
    let weight = 0;
    for (const r of reports) {
      const v = r.occupancySeries.current[0];
      if (v != null) {
        weighted += v * r.rentRoll.totalUnits;
        weight += r.rentRoll.totalUnits;
      }
    }
    expect(Math.abs((holding.occupancySeries.current[0] as number) - weighted / weight)).toBeLessThan(1e-6);
    // A future month is null for the current year
    expect(holding.occupancySeries.current[11]).toBeNull();
  });

  it("rolls up only the properties that report a given quarter", async () => {
    // 2025-q4 excludes elmgrove
    const reports = await propertyReportsFor("2025-q4");
    expect(reports.length).toBe(4);
    const holding = (await ds.getReport({ kind: "holding" }, "2025-q4")) as QuarterlyReport;
    if (holding.identity.kind === "holding") {
      expect(holding.identity.propertyCount).toBe(4);
    }
    expect(holding.narrative).toBeNull();
    expect(holding.images).toBeNull();
    expect(holding.composition?.properties.length).toBe(4);
  });

  it("aggregateHolding throws on an empty set", () => {
    expect(() => aggregateHolding([])).toThrow();
  });
});

describe("availableQuarters", () => {
  it("reflects per-property availability and the holding union", async () => {
    expect(await ds.availableQuarters({ kind: "property", propertyId: "elmgrove" })).toEqual(["2026-q1"]);
    expect(await ds.availableQuarters({ kind: "property", propertyId: "acacia" })).toEqual(["2025-q4", "2026-q1"]);
    expect(await ds.availableQuarters({ kind: "holding" })).toEqual(["2025-q4", "2026-q1"]);
  });
});
