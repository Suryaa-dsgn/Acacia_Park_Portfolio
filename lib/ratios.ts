// lib/ratios.ts
// Derived operating ratios (legacy "Ratios" tab), computed only from figures the
// governed source actually carries. Anything needing debt service, capital, GL
// detail, delinquency, or applications is deliberately omitted (see OMITTED_RATIOS
// below) rather than fabricated. Pure functions over a QuarterlyReport, so this is
// server- and client-safe and reused by the report views and the Compare page.
//
// Periodicity note: statement figures (income, expenses, NOI) are per quarter.
// Rent-roll rent dollars (totalMarketRent, totalInPlaceRent) are a MONTHLY
// schedule, so quarterly Gross Potential Rent is totalMarketRent * 3.
import type { QuarterlyReport, StatementLine } from "./types";

export type RatioFormat = "percent" | "money" | "money2";

export interface RatioItem {
  key: string;
  label: string;
  value: number | null; // null renders as "n/a" (guarded divide-by-zero)
  format: RatioFormat;
  formula: string; // shown as a mono caption under the value
}

export interface RatioGroup {
  group: string;
  items: RatioItem[];
}

// Ratios we intentionally do NOT compute, because the governed source lacks the
// inputs. Surfaced as a footnote so the omission is explicit, not a silent gap.
export const OMITTED_RATIOS: string[] = [
  "Net Income Margin",
  "Debt Service Coverage (DSCR)",
  "Debt Service % of Income",
  "CapEx per Unit",
  "Lease Expiration Exposure",
  "Delinquency and Delinquency % of GPR",
  "Applicant Conversion Rate",
];

function safeDiv(a: number, b: number): number | null {
  if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return null;
  return a / b;
}

function lineValue(lines: StatementLine[], key: string): number {
  const line = lines.find((l) => l.key === key);
  return line ? line.ptdCurrent : 0;
}

// Build the grouped ratio set. Leasing-gated items are dropped entirely when the
// quarter has no governed leasing, so a group never shows a row of "n/a".
export function computeRatios(report: QuarterlyReport): RatioGroup[] {
  const os = report.operatingStatement;
  const rr = report.rentRoll;
  const leasing = report.leasing;

  const totalIncome = os.totalIncome.ptdCurrent;
  const opex = os.totalOperatingExpenses.ptdCurrent;
  const noi = os.netOperatingIncome.ptdCurrent;
  const units = rr.totalUnits;
  const occupied = rr.occupiedUnits;
  const occupiedSqFt = occupied * rr.avgUnitSqFt;
  const quarterlyGpr = rr.totalMarketRent * 3;
  const fixed = lineValue(os.expenses, "fixedExpenses");
  const payroll = lineValue(os.expenses, "payrollLabor");
  const rm = lineValue(os.expenses, "repairsMaintenance");
  const makeReady = lineValue(os.expenses, "makeReadyTurnover");
  const lossToLease = rr.totalMarketRent - rr.totalInPlaceRent;

  const groups: RatioGroup[] = [
    {
      group: "Profitability & Returns",
      items: [
        { key: "noiMargin", label: "NOI Margin", value: safeDiv(noi, totalIncome), format: "percent", formula: "NOI / Total Income" },
        { key: "opexRatio", label: "Operating Expense Ratio", value: safeDiv(opex, totalIncome), format: "percent", formula: "Total OpEx / Total Income" },
        { key: "noiPerUnit", label: "NOI per Unit", value: safeDiv(noi, units), format: "money", formula: "NOI / Units" },
        { key: "revPerAvailUnit", label: "Revenue per Available Unit", value: safeDiv(totalIncome, units), format: "money", formula: "Total Income / Units" },
        { key: "revPerOccUnit", label: "Revenue per Occupied Unit", value: safeDiv(totalIncome, occupied), format: "money", formula: "Total Income / Occupied Units" },
        { key: "breakevenOcc", label: "Breakeven Occupancy (excl. debt)", value: safeDiv(opex, quarterlyGpr), format: "percent", formula: "Total OpEx / Gross Potential Rent" },
      ],
    },
    {
      group: "Rent & Pricing",
      items: [
        { key: "lossToLease", label: "Loss to Lease", value: lossToLease, format: "money", formula: "Market Rent - In-Place Rent" },
        { key: "lossToLeasePct", label: "Loss to Lease %", value: safeDiv(lossToLease, rr.totalMarketRent), format: "percent", formula: "Loss to Lease / Market Rent" },
        { key: "rentPsf", label: "Avg In-Place Rent PSF", value: safeDiv(rr.totalInPlaceRent, occupiedSqFt), format: "money2", formula: "In-Place Rent / Occupied Sq Ft" },
        { key: "marketPsf", label: "Avg Market Rent PSF", value: safeDiv(rr.totalMarketRent, rr.totalSqFt), format: "money2", formula: "Market Rent / Total Sq Ft" },
      ],
    },
    {
      group: "Expense Efficiency",
      items: [
        { key: "opexPerUnit", label: "OpEx per Unit", value: safeDiv(opex, units), format: "money", formula: "Total OpEx / Units" },
        { key: "controllableRatio", label: "Controllable Expense Ratio", value: safeDiv(opex - fixed, totalIncome), format: "percent", formula: "(Total OpEx - Fixed) / Total Income" },
        { key: "payrollPerUnit", label: "Payroll per Unit", value: safeDiv(payroll, units), format: "money", formula: "Payroll / Units" },
        { key: "rmPerUnit", label: "R&M per Unit", value: safeDiv(rm, units), format: "money", formula: "Repairs & Maintenance / Units" },
      ],
    },
  ];

  // Occupancy & Demand and the turnover-cost ratio need governed leasing.
  if (leasing) {
    groups.splice(1, 0, {
      group: "Occupancy & Demand",
      items: [
        { key: "retention", label: "Retention / Renewal Rate", value: safeDiv(leasing.renewals, leasing.renewals + leasing.moveOuts), format: "percent", formula: "Renewals / (Renewals + Move-outs)" },
        { key: "noticeRate", label: "Notice Rate", value: safeDiv(leasing.noticesToVacate, occupied), format: "percent", formula: "Notices to Vacate / Occupied Units" },
      ],
    });
    const expenseGroup = groups.find((g) => g.group === "Expense Efficiency");
    expenseGroup?.items.push({
      key: "turnoverCostPerUnit",
      label: "Turnover Cost per Unit Turned",
      value: safeDiv(makeReady, leasing.moveOuts),
      format: "money",
      formula: "Make Ready / Turnover / Move-outs",
    });
  }

  return groups;
}
