// lib/aggregate.ts
// Holding (All Holdings) roll-up (DM section 4). Assembles a QuarterlyReport with
// scope "holding" from every property's report for the same quarter. Additive
// figures are summed; occupancy and rents are derived from rolled-up totals
// (never averaged from per-property percentages); monthly occupancy is
// unit-weighted. Every derived denominator is guarded against zero. The same
// aggregation feeds both the on-screen roll-up and the export, so they never
// disagree (export spec section 4).
import { pctChange } from "./format";
import type {
  QuarterlyReport,
  StatementLine,
  OperatingStatement,
  RentRollSummary,
  LeasingActivity,
  OccupancySeries,
  OccupancyRentHistory,
  ProvenanceEntry,
  PropertyComposition,
  HoldingIdentity,
} from "./types";

function safeDiv(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : numerator / denominator;
}

// Sum one statement line (identified by a selector) across all reports, keeping
// the label, favorability, and flags from the first report.
function sumLine(
  reports: QuarterlyReport[],
  select: (os: OperatingStatement) => StatementLine,
): StatementLine {
  const first = select(reports[0].operatingStatement);
  const acc: StatementLine = {
    ...first,
    glCode: undefined, // GL codes are property-specific, drop at roll-up
    ptdCurrent: 0,
    ptdPrior: 0,
    ytdCurrent: 0,
    ytdPrior: 0,
  };
  for (const r of reports) {
    const line = select(r.operatingStatement);
    acc.ptdCurrent += line.ptdCurrent;
    acc.ptdPrior += line.ptdPrior;
    acc.ytdCurrent += line.ytdCurrent;
    acc.ytdPrior += line.ytdPrior;
  }
  return acc;
}

function aggregateStatement(reports: QuarterlyReport[]): OperatingStatement {
  const first = reports[0].operatingStatement;
  return {
    income: first.income.map((_, i) =>
      sumLine(reports, (os) => os.income[i]),
    ),
    totalIncome: sumLine(reports, (os) => os.totalIncome),
    expenses: first.expenses.map((_, i) =>
      sumLine(reports, (os) => os.expenses[i]),
    ),
    totalOperatingExpenses: sumLine(
      reports,
      (os) => os.totalOperatingExpenses,
    ),
    netOperatingIncome: sumLine(reports, (os) => os.netOperatingIncome),
  };
}

function aggregateRentRoll(reports: QuarterlyReport[]): RentRollSummary {
  const rr = reports.map((r) => r.rentRoll);
  const sum = (pick: (x: RentRollSummary) => number) =>
    rr.reduce((a, x) => a + pick(x), 0);

  const totalUnits = sum((x) => x.totalUnits);
  const occupiedUnits = sum((x) => x.occupiedUnits);
  const vacantUnits = sum((x) => x.vacantUnits);
  const totalSqFt = sum((x) => x.totalSqFt);
  const totalMarketRent = sum((x) => x.totalMarketRent);
  const totalInPlaceRent = sum((x) => x.totalInPlaceRent);

  // avgResidentRent has no authoritative roll-up definition in the governed
  // file; provisional is an occupied-unit-weighted mean of the property values.
  // Flagged as computed in provenance until the partner confirms (DM 4.1).
  const residentWeighted = rr.reduce(
    (a, x) => a + x.avgResidentRent * x.occupiedUnits,
    0,
  );

  return {
    asOf: rr[0].asOf,
    totalUnits,
    occupiedUnits,
    vacantUnits,
    physicalOccupancy: safeDiv(occupiedUnits, totalUnits),
    totalSqFt,
    avgUnitSqFt: safeDiv(totalSqFt, totalUnits),
    avgUnitRent: safeDiv(totalInPlaceRent, totalUnits),
    avgOccupiedUnitRent: safeDiv(totalInPlaceRent, occupiedUnits), // confirm
    avgResidentRent: safeDiv(residentWeighted, occupiedUnits), // confirm
    totalMarketRent,
    totalInPlaceRent,
    economicOccupancy: safeDiv(totalInPlaceRent, totalMarketRent),
  };
}

function aggregateLeasing(reports: QuarterlyReport[]): LeasingActivity | null {
  // Roll up only the properties whose leasing is governed this quarter.
  const ls = reports
    .map((r) => r.leasing)
    .filter((x): x is LeasingActivity => x != null);
  if (ls.length === 0) return null;
  const sum = (pick: (x: LeasingActivity) => number) =>
    ls.reduce((a, x) => a + pick(x), 0);
  const moveIns = sum((x) => x.moveIns);
  const moveOuts = sum((x) => x.moveOuts);
  return {
    moveIns,
    moveOuts,
    netAbsorption: moveIns - moveOuts,
    noticesToVacate: sum((x) => x.noticesToVacate),
    unitsRented: sum((x) => x.unitsRented),
    renewals: sum((x) => x.renewals),
    evictions: sum((x) => x.evictions),
  };
}

// Unit-weighted average occupancy per month, across properties that have data
// that month. Months where no property reported are null.
function weightedMonth(
  reports: QuarterlyReport[],
  pick: (s: OccupancySeries) => (number | null)[],
): (number | null)[] {
  const out: (number | null)[] = [];
  for (let m = 0; m < 12; m++) {
    let weighted = 0;
    let weight = 0;
    for (const r of reports) {
      const v = pick(r.occupancySeries)[m];
      if (v != null) {
        const units = r.rentRoll.totalUnits;
        weighted += v * units;
        weight += units;
      }
    }
    out.push(weight === 0 ? null : weighted / weight);
  }
  return out;
}

function aggregateOccupancy(reports: QuarterlyReport[]): OccupancySeries {
  const first = reports[0].occupancySeries;
  return {
    currentYear: first.currentYear,
    priorYear: first.priorYear,
    current: weightedMonth(reports, (s) => s.current),
    prior: weightedMonth(reports, (s) => s.prior),
  };
}

// Unit-weighted roll-up of the two-year occupancy + rent history. Occupancy and
// rent are both weighted by property units, month by month, across the
// properties that carry the history. Returns undefined if none do.
function aggregateOccupancyRentHistory(
  reports: QuarterlyReport[],
): OccupancyRentHistory | undefined {
  const withHistory = reports.filter((r) => r.occupancyRentHistory);
  if (withHistory.length === 0) return undefined;
  const years = withHistory[0].occupancyRentHistory!.years;

  const weightedSeries = (
    pick: (h: OccupancyRentHistory, yearIdx: number) => number[],
    yearIdx: number,
  ): number[] =>
    Array.from({ length: 12 }, (_, m) => {
      let weighted = 0;
      let weight = 0;
      for (const r of withHistory) {
        const v = pick(r.occupancyRentHistory!, yearIdx)[m];
        if (v != null) {
          const units = r.rentRoll.totalUnits;
          weighted += v * units;
          weight += units;
        }
      }
      return weight === 0 ? 0 : weighted / weight;
    });

  return {
    years,
    occupancy: [
      weightedSeries((h, y) => h.occupancy[y], 0),
      weightedSeries((h, y) => h.occupancy[y], 1),
    ],
    avgInPlaceRent: [
      weightedSeries((h, y) => h.avgInPlaceRent[y], 0),
      weightedSeries((h, y) => h.avgInPlaceRent[y], 1),
    ],
  };
}

function parseCityState(cityStateZip: string): { city: string; state: string } {
  const [cityPart, rest] = cityStateZip.split(",");
  const state = (rest ?? "").trim().split(/\s+/)[0] ?? "";
  return { city: (cityPart ?? "").trim(), state };
}

function buildComposition(reports: QuarterlyReport[]): PropertyComposition[] {
  return reports.map((r) => {
    const id =
      r.scope.kind === "property" ? r.scope.propertyId : "unknown";
    const identity =
      r.identity.kind === "property"
        ? r.identity
        : null;
    const { city, state } = parseCityState(identity?.cityStateZip ?? "");
    const noi = r.operatingStatement.netOperatingIncome.ptdCurrent;
    const noiPrior = r.operatingStatement.netOperatingIncome.ptdPrior;
    return {
      propertyId: id,
      tradeName: identity?.tradeName ?? id,
      city,
      state,
      units: r.rentRoll.totalUnits,
      noi,
      occupancy: r.rentRoll.physicalOccupancy,
      yoyNoi: pctChange(noi, noiPrior),
    };
  });
}

function buildIdentity(reports: QuarterlyReport[]): HoldingIdentity {
  const totalUnits = reports.reduce((a, r) => a + r.rentRoll.totalUnits, 0);
  const totalSqFt = reports.reduce((a, r) => a + r.rentRoll.totalSqFt, 0);
  const markets = Array.from(
    new Set(
      reports.map((r) => {
        if (r.identity.kind !== "property") return "";
        if (r.identity.submarket) return r.identity.submarket;
        return parseCityState(r.identity.cityStateZip).state;
      }),
    ),
  )
    .filter(Boolean)
    .sort();
  return {
    kind: "holding",
    label: `All Holdings: ${reports.length} properties`,
    propertyCount: reports.length,
    totalUnits,
    totalSqFt,
    markets,
  };
}

function buildProvenance(reports: QuarterlyReport[]): ProvenanceEntry[] {
  const label = reports[0].meta.quarterLabel;
  return [
    {
      text: `Governed roll-up of ${reports.length} property reports for ${label}.`,
    },
    {
      text: "Additive figures summed. Occupancy and economic occupancy derived from rolled-up totals, not averaged from property percentages.",
    },
    {
      text: "Average occupied unit rent and average resident rent are computed roll-ups, pending confirmation of the governed portfolio definition.",
    },
    { text: `Cash basis. Prior-year comparatives rolled up from the same set.` },
  ];
}

// Aggregate a set of property reports (all for the same quarter) into a single
// holding report. Callers must pass at least one report.
export function aggregateHolding(
  reports: QuarterlyReport[],
): QuarterlyReport {
  if (reports.length === 0) {
    throw new Error("aggregateHolding requires at least one property report");
  }
  return {
    meta: reports[0].meta,
    identity: buildIdentity(reports),
    operatingStatement: aggregateStatement(reports),
    rentRoll: aggregateRentRoll(reports),
    leasing: aggregateLeasing(reports),
    occupancySeries: aggregateOccupancy(reports),
    occupancyRentHistory: aggregateOccupancyRentHistory(reports),
    narrative: null,
    images: null,
    provenance: buildProvenance(reports),
    composition: { properties: buildComposition(reports) },
    scope: { kind: "holding" },
  };
}
