import { describe, it, expect } from "vitest";
import { computeRatios, OMITTED_RATIOS, type RatioItem } from "./ratios";
import type { QuarterlyReport } from "./types";
import acaciaQ1 from "../fixtures/acacia/2026-q1.json";

const report = acaciaQ1 as unknown as QuarterlyReport;

function find(groups: ReturnType<typeof computeRatios>, key: string): RatioItem {
  for (const g of groups) {
    const item = g.items.find((i) => i.key === key);
    if (item) return item;
  }
  throw new Error(`ratio not found: ${key}`);
}

describe("computeRatios (Acacia Q1 2026)", () => {
  const groups = computeRatios(report);

  it("computes profitability ratios", () => {
    expect(find(groups, "noiMargin").value).toBeCloseTo(0.31091, 5);
    expect(find(groups, "opexRatio").value).toBeCloseTo(0.689090, 5);
    expect(find(groups, "noiPerUnit").value).toBeCloseTo(1809.884, 2);
    expect(find(groups, "revPerAvailUnit").value).toBeCloseTo(5821.254, 2);
    expect(find(groups, "revPerOccUnit").value).toBeCloseTo(6081.31, 2);
    expect(find(groups, "breakevenOcc").value).toBeCloseTo(0.684718, 5);
  });

  it("computes rent & pricing ratios", () => {
    expect(find(groups, "lossToLease").value).toBeCloseTo(43113, 0);
    expect(find(groups, "lossToLeasePct").value).toBeCloseTo(0.072623, 5);
    expect(find(groups, "rentPsf").value).toBeCloseTo(2.22578, 4);
    expect(find(groups, "marketPsf").value).toBeCloseTo(2.29744, 4);
  });

  it("computes expense-efficiency ratios", () => {
    expect(find(groups, "opexPerUnit").value).toBeCloseTo(4011.37, 2);
    expect(find(groups, "controllableRatio").value).toBeCloseTo(0.287595, 5);
    expect(find(groups, "payrollPerUnit").value).toBeCloseTo(472.906, 2);
    expect(find(groups, "rmPerUnit").value).toBeCloseTo(276.498, 2);
  });

  it("computes leasing-gated ratios when leasing is present", () => {
    expect(find(groups, "retention").value).toBeCloseTo(0.676056, 5);
    expect(find(groups, "noticeRate").value).toBeCloseTo(0.075601, 5);
    expect(find(groups, "turnoverCostPerUnit").value).toBeCloseTo(2459.31, 2);
  });

  it("omits leasing-gated groups when leasing is null", () => {
    const noLeasing = { ...report, leasing: null } as QuarterlyReport;
    const g = computeRatios(noLeasing);
    expect(g.find((x) => x.group === "Occupancy & Demand")).toBeUndefined();
    const expense = g.find((x) => x.group === "Expense Efficiency");
    expect(expense?.items.some((i) => i.key === "turnoverCostPerUnit")).toBe(false);
  });

  it("names the omitted ratios explicitly", () => {
    expect(OMITTED_RATIOS).toContain("Debt Service Coverage (DSCR)");
    expect(OMITTED_RATIOS.length).toBeGreaterThan(0);
  });
});
