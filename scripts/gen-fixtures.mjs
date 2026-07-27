// scripts/gen-fixtures.mjs
// Fixture generator (build plan Phase 2). Expands compact per-property seeds into
// contract-exact QuarterlyReport JSON under fixtures/<propertyId>/<quarter>.json,
// plus fixtures/manifest.json. Totals are always the sum of their lines and NOI
// is always income minus expenses, by construction, so no fixture can drift out
// of internal consistency. Acacia Q1 2026 matches the governed sample exactly.
//
// Run: npm run gen:fixtures
//
// No em dashes anywhere in the emitted data. Governed source em dashes are
// handled by lib/normalize.ts on ingestion; these fixtures are clean already.
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FIX = join(ROOT, "fixtures");

const r2 = (n) => Math.round(n * 100) / 100;
const r4 = (n) => Math.round(n * 10000) / 10000;
const r6 = (n) => Math.round(n * 1e6) / 1e6;
const scaleObj = (obj, f) =>
  Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, r2(v * f)]));

const INCOME_KEYS = [
  ["rentalIncome", "Rental Income"],
  ["otherResidentIncome", "Other Resident Income"],
  ["otherPropertyIncome", "Other Property Income"],
];
const EXPENSE_KEYS = [
  ["fixedExpenses", "Fixed Expenses"],
  ["repairsMaintenance", "Repairs & Maintenance"],
  ["utilities", "Utilities"],
  ["gAndA", "General & Administrative"],
  ["marketing", "Marketing"],
  ["makeReadyTurnover", "Make Ready / Turnover"],
  ["professionalServices", "Professional Services"],
  ["payrollLabor", "Payroll / Labor"],
];
const GL = {
  rentalIncome: "4300-0000",
  otherResidentIncome: "4400-0000",
  otherPropertyIncome: "4500-0000",
  fixedExpenses: "6000-0000",
  repairsMaintenance: "6100-0000",
  utilities: "6200-0000",
  gAndA: "6300-0000",
  marketing: "6400-0000",
  makeReadyTurnover: "6500-0000",
  professionalServices: "6600-0000",
  payrollLabor: "6700-0000",
};

const QUARTER_ORDER = ["2025-q4", "2026-q1"];
const META = {
  "2026-q1": {
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
  "2025-q4": {
    quarter: "2025-q4",
    quarterLabel: "Q4'25",
    fiscalYear: 2025,
    quarterNumber: 4,
    periodStart: "2025-10-01",
    periodEnd: "2025-12-31",
    priorPeriodStart: "2024-10-01",
    priorPeriodEnd: "2024-12-31",
    accountingBasis: "Cash",
    rentRollAsOf: "2025-12-31",
    generatedAt: "2026-01-15T09:00:00Z",
  },
};

function priorLabel(meta) {
  return `Q${meta.quarterNumber}'${String(meta.fiscalYear - 1).slice(2)}`;
}

function mkLine(key, label, cur, prior, ytdMult, favorability) {
  const line = {
    key,
    label,
    ptdCurrent: r2(cur),
    ptdPrior: r2(prior),
    ytdCurrent: r2(cur * ytdMult),
    ytdPrior: r2(prior * ytdMult),
    favorability,
  };
  if (GL[key]) line.glCode = GL[key];
  return line;
}

function sumLines(key, label, lines, favorability, flags) {
  const field = (f) => r2(lines.reduce((a, l) => a + l[f], 0));
  return {
    key,
    label,
    ptdCurrent: field("ptdCurrent"),
    ptdPrior: field("ptdPrior"),
    ytdCurrent: field("ytdCurrent"),
    ytdPrior: field("ytdPrior"),
    favorability,
    ...flags,
  };
}

function subLines(key, label, a, b, favorability, flags) {
  return {
    key,
    label,
    ptdCurrent: r2(a.ptdCurrent - b.ptdCurrent),
    ptdPrior: r2(a.ptdPrior - b.ptdPrior),
    ytdCurrent: r2(a.ytdCurrent - b.ytdCurrent),
    ytdPrior: r2(a.ytdPrior - b.ytdPrior),
    favorability,
    ...flags,
  };
}

function buildStatement(incCur, expCur, incPrior, expPrior, ytdMult) {
  const income = INCOME_KEYS.map(([k, l]) =>
    mkLine(k, l, incCur[k], incPrior[k], ytdMult, "higherIsBetter"),
  );
  const expenses = EXPENSE_KEYS.map(([k, l]) =>
    mkLine(k, l, expCur[k], expPrior[k], ytdMult, "lowerIsBetter"),
  );
  const totalIncome = sumLines("totalIncome", "Total Income", income, "higherIsBetter", { isSubtotal: true });
  const totalOperatingExpenses = sumLines(
    "totalOperatingExpenses",
    "Total Operating Expenses",
    expenses,
    "lowerIsBetter",
    { isSubtotal: true },
  );
  const netOperatingIncome = subLines(
    "netOperatingIncome",
    "Net Operating Income",
    totalIncome,
    totalOperatingExpenses,
    "higherIsBetter",
    { isResult: true },
  );
  return { income, totalIncome, expenses, totalOperatingExpenses, netOperatingIncome };
}

const NARR_TITLES = {
  marketCommentary: "Market Commentary",
  propertyOperations: "Property Operations",
  conditionsRenovation: "Property Conditions & Renovation Plans",
};

function narrativeCompleted() {
  return [
    { key: "marketCommentary", title: NARR_TITLES.marketCommentary, status: "Completed", body: "Prior quarter market commentary, finalized." },
    { key: "propertyOperations", title: NARR_TITLES.propertyOperations, status: "Completed", body: "Prior quarter operations summary, finalized." },
    { key: "conditionsRenovation", title: NARR_TITLES.conditionsRenovation, status: "Completed", body: "Prior quarter conditions and renovation notes, finalized." },
  ];
}

function reportFor(seed, quarter) {
  const meta = META[quarter];
  const q1 = quarter === "2026-q1";
  const ytdMult = q1 ? 1 : 4;

  const incCur = q1 ? seed.incomeCur : scaleObj(seed.incomeCur, 0.98);
  const expCur = q1 ? seed.expenseCur : scaleObj(seed.expenseCur, 0.99);
  const incPrior =
    q1 && seed.incomePriorExplicit
      ? seed.incomePriorExplicit
      : scaleObj(incCur, 0.945);
  const expPrior =
    q1 && seed.expensePriorExplicit
      ? seed.expensePriorExplicit
      : scaleObj(expCur, 0.905);

  const operatingStatement = buildStatement(incCur, expCur, incPrior, expPrior, ytdMult);

  const units = seed.units;
  const rr = seed.rr;
  const occupied = q1 ? rr.occupied : Math.round(rr.occupied * 0.99);
  const market = q1 ? rr.totalMarketRent : r2(rr.totalMarketRent * 0.99);
  const inPlace = q1 ? rr.totalInPlaceRent : r2(rr.totalInPlaceRent * 0.985);
  const rentRoll = {
    asOf: meta.rentRollAsOf,
    totalUnits: units,
    occupiedUnits: occupied,
    vacantUnits: units - occupied,
    physicalOccupancy: r6(occupied / units),
    totalSqFt: seed.totalSqFt,
    avgUnitSqFt: rr.avgUnitSqFt,
    avgUnitRent: q1 ? rr.avgUnitRent : r2(inPlace / units),
    avgOccupiedUnitRent: q1 ? rr.avgOccupiedUnitRent : r2(inPlace / occupied),
    avgResidentRent: q1 ? rr.avgResidentRent : r2(rr.avgResidentRent * 0.99),
    totalMarketRent: market,
    totalInPlaceRent: inPlace,
    economicOccupancy: r6(inPlace / market),
  };

  const l = seed.leasingQ1;
  const leasing = q1
    ? { ...l, netAbsorption: l.moveIns - l.moveOuts }
    : (() => {
        const moveIns = Math.round(l.moveIns * 0.95);
        const moveOuts = Math.round(l.moveOuts * 0.95);
        return {
          moveIns,
          moveOuts,
          netAbsorption: moveIns - moveOuts,
          noticesToVacate: Math.round(l.noticesToVacate * 0.95),
          unitsRented: Math.round(l.unitsRented * 0.95),
          renewals: Math.round(l.renewals * 0.95),
          evictions: Math.max(0, Math.round(l.evictions * 0.95)),
        };
      })();

  const occupancySeries = q1
    ? { currentYear: 2026, priorYear: 2025, current: seed.occ2026, prior: seed.occ2025 }
    : {
        currentYear: 2025,
        priorYear: 2024,
        current: seed.occ2025,
        prior: seed.occ2025.map((v) => (v == null ? null : r4(v * 0.99))),
      };

  const narrative = q1 ? seed.narrativeQ1 : narrativeCompleted();

  return {
    meta,
    identity: {
      kind: "property",
      tradeName: seed.tradeName,
      legalEntity: seed.legalEntity,
      manager: seed.manager,
      addressLine: seed.addressLine,
      cityStateZip: seed.cityStateZip,
      submarket: seed.submarket,
      units: seed.units,
      totalSqFt: seed.totalSqFt,
    },
    operatingStatement,
    rentRoll,
    leasing,
    occupancySeries,
    narrative,
    images: [
      { slot: "propertyPhoto", url: null, alt: `${seed.tradeName} property photo` },
      { slot: "aerialSiteMap", url: null, alt: `${seed.tradeName} aerial site map` },
    ],
    provenance: [
      { text: `Governed from Yardi Voyager quarterly export, ${meta.quarterLabel}.` },
      { text: "Cash basis. 5 quarters retained." },
      { text: `Prior-year comparatives from ${priorLabel(meta)} governed export.` },
    ],
    scope: { kind: "property", propertyId: seed.id },
  };
}

// A full year of prior-year monthly occupancy, one array per property.
const OCC = {
  acacia2025: [0.921, 0.925, 0.931, 0.938, 0.942, 0.949, 0.951, 0.948, 0.944, 0.939, 0.933, 0.928],
  acacia2026: [0.9312, 0.9397, 0.9402, 0.9359, 0.9349, null, null, null, null, null, null, null],
  brightwater2025: [0.958, 0.961, 0.964, 0.966, 0.969, 0.971, 0.973, 0.972, 0.97, 0.967, 0.963, 0.96],
  brightwater2026: [0.968, 0.97, 0.972, 0.971, 0.973, null, null, null, null, null, null, null],
  cedarfield2025: [0.945, 0.943, 0.94, 0.938, 0.935, 0.933, 0.93, 0.928, 0.926, 0.925, 0.924, 0.923],
  cedarfield2026: [0.93, 0.926, 0.923, 0.921, 0.919, null, null, null, null, null, null, null],
  dunmore2025: [0.905, 0.903, 0.901, 0.899, 0.897, 0.895, 0.893, 0.892, 0.891, 0.89, 0.889, 0.888],
  dunmore2026: [0.893, 0.891, 0.889, 0.886, 0.884, null, null, null, null, null, null, null],
  elmgrove2025: [0.939, 0.941, 0.943, 0.944, 0.946, 0.948, 0.949, 0.948, 0.947, 0.946, 0.945, 0.944],
  elmgrove2026: [0.945, 0.947, 0.948, 0.949, 0.951, null, null, null, null, null, null, null],
};

const SEEDS = [
  {
    id: "acacia",
    tradeName: "Universe at Acacia",
    legalEntity: "Universe at Acacia (DE), LLC",
    manager: "Meridian Residential",
    addressLine: "5280 N Little Mountain Dr",
    cityStateZip: "San Bernardino, CA 92407",
    submarket: "Inland Empire",
    units: 304,
    totalSqFt: 258400,
    quarters: ["2025-q4", "2026-q1"],
    // Exact governed Q1 2026 breakdown. Income and expense lines sum to the
    // governed totals; NOI follows. (DM section 2.3.)
    incomeCur: { rentalIncome: 1650000, otherResidentIncome: 85000, otherPropertyIncome: 34661.34 },
    expenseCur: {
      fixedExpenses: 174000, repairsMaintenance: 205000, utilities: 268000, gAndA: 96000,
      marketing: 34000, makeReadyTurnover: 28000, professionalServices: 13456.58, payrollLabor: 401000,
    },
    incomePriorExplicit: { rentalIncome: 1560000, otherResidentIncome: 78000, otherPropertyIncome: 31096.26 },
    expensePriorExplicit: {
      fixedExpenses: 150000, repairsMaintenance: 120000, utilities: 190000, gAndA: 60000,
      marketing: 22000, makeReadyTurnover: 12000, professionalServices: 8475.49, payrollLabor: 300000,
    },
    rr: {
      occupied: 291, totalMarketRent: 593657, totalInPlaceRent: 550544,
      avgUnitSqFt: 850, avgUnitRent: 1811, avgOccupiedUnitRent: 1952.81, avgResidentRent: 1876.95,
    },
    leasingQ1: { moveIns: 28, moveOuts: 23, noticesToVacate: 22, unitsRented: 57, renewals: 48, evictions: 2 },
    occ2025: OCC.acacia2025,
    occ2026: OCC.acacia2026,
    narrativeQ1: [
      { key: "marketCommentary", title: NARR_TITLES.marketCommentary, status: "Completed", body: "Inland Empire demand held firm through the quarter. In-place rents moved up modestly while concessions persisted at the low end of the market. Renewal conversions stayed healthy." },
      { key: "propertyOperations", title: NARR_TITLES.propertyOperations, status: "Work in Progress", body: "Turn times improved after the make-ready backlog cleared in February. A payroll reclassification is under review with the regional team." },
      { key: "conditionsRenovation", title: NARR_TITLES.conditionsRenovation, status: "Gathering Info", body: null },
    ],
  },
  {
    id: "brightwater",
    tradeName: "Brightwater Commons",
    legalEntity: "Brightwater Commons (TX), LLC",
    manager: "Meridian Residential",
    addressLine: "1400 Wells Branch Pkwy",
    cityStateZip: "Austin, TX 78728",
    submarket: "North Austin",
    units: 218,
    totalSqFt: 191000,
    quarters: ["2025-q4", "2026-q1"],
    incomeCur: { rentalIncome: 1150000, otherResidentIncome: 60000, otherPropertyIncome: 22000 },
    expenseCur: {
      fixedExpenses: 150000, repairsMaintenance: 96000, utilities: 132000, gAndA: 48000,
      marketing: 30000, makeReadyTurnover: 18000, professionalServices: 8000, payrollLabor: 210000,
    },
    rr: {
      occupied: 212, totalMarketRent: 360000, totalInPlaceRent: 342000,
      avgUnitSqFt: 876, avgUnitRent: 1569, avgOccupiedUnitRent: 1613, avgResidentRent: 1590,
    },
    leasingQ1: { moveIns: 20, moveOuts: 15, noticesToVacate: 12, unitsRented: 34, renewals: 30, evictions: 0 },
    occ2025: OCC.brightwater2025,
    occ2026: OCC.brightwater2026,
    narrativeQ1: [
      { key: "marketCommentary", title: NARR_TITLES.marketCommentary, status: "Completed", body: "North Austin absorption stayed strong. New supply deliveries slowed, supporting rent growth on renewals." },
      { key: "propertyOperations", title: NARR_TITLES.propertyOperations, status: "Completed", body: "Operations steady. Preventive maintenance on schedule, no material variances." },
      { key: "conditionsRenovation", title: NARR_TITLES.conditionsRenovation, status: "Work in Progress", body: "Amenity refresh in planning. Clubhouse scope is being finalized with the design partner." },
    ],
  },
  {
    id: "cedarfield",
    tradeName: "Cedarfield Flats",
    legalEntity: "Cedarfield Flats (CO), LLC",
    manager: "Aspen Peak Management",
    addressLine: "8800 E Hampden Ave",
    cityStateZip: "Denver, CO 80231",
    submarket: "Southeast Denver",
    units: 156,
    totalSqFt: 132600,
    quarters: ["2025-q4", "2026-q1"],
    incomeCur: { rentalIncome: 720000, otherResidentIncome: 34000, otherPropertyIncome: 14000 },
    expenseCur: {
      fixedExpenses: 92000, repairsMaintenance: 60000, utilities: 78000, gAndA: 30000,
      marketing: 20000, makeReadyTurnover: 12000, professionalServices: 5000, payrollLabor: 120000,
    },
    rr: {
      occupied: 144, totalMarketRent: 218000, totalInPlaceRent: 196000,
      avgUnitSqFt: 850, avgUnitRent: 1256, avgOccupiedUnitRent: 1361, avgResidentRent: 1330,
    },
    leasingQ1: { moveIns: 14, moveOuts: 18, noticesToVacate: 16, unitsRented: 22, renewals: 19, evictions: 1 },
    occ2025: OCC.cedarfield2025,
    occ2026: OCC.cedarfield2026,
    narrativeQ1: [
      { key: "marketCommentary", title: NARR_TITLES.marketCommentary, status: "Work in Progress", body: "Southeast Denver softened on elevated concessions. Traffic held, but net effective rents slipped." },
      { key: "propertyOperations", title: NARR_TITLES.propertyOperations, status: "Gathering Info", body: null },
      { key: "conditionsRenovation", title: NARR_TITLES.conditionsRenovation, status: "Not Started", body: null },
    ],
  },
  {
    id: "dunmore",
    tradeName: "Dunmore Yards",
    legalEntity: "Dunmore Yards (OH), LLC",
    manager: "Aspen Peak Management",
    addressLine: "2100 Eakin Rd",
    cityStateZip: "Columbus, OH 43223",
    submarket: "West Columbus",
    units: 402,
    totalSqFt: 341700,
    quarters: ["2025-q4", "2026-q1"],
    incomeCur: { rentalIncome: 1520000, otherResidentIncome: 70000, otherPropertyIncome: 30000 },
    expenseCur: {
      fixedExpenses: 210000, repairsMaintenance: 150000, utilities: 175000, gAndA: 70000,
      marketing: 60000, makeReadyTurnover: 40000, professionalServices: 12000, payrollLabor: 320000,
    },
    rr: {
      occupied: 357, totalMarketRent: 522000, totalInPlaceRent: 452000,
      avgUnitSqFt: 850, avgUnitRent: 1124, avgOccupiedUnitRent: 1266, avgResidentRent: 1240,
    },
    leasingQ1: { moveIns: 30, moveOuts: 34, noticesToVacate: 40, unitsRented: 45, renewals: 38, evictions: 3 },
    occ2025: OCC.dunmore2025,
    occ2026: OCC.dunmore2026,
    narrativeQ1: [
      { key: "marketCommentary", title: NARR_TITLES.marketCommentary, status: "Gathering Info", body: null },
      { key: "propertyOperations", title: NARR_TITLES.propertyOperations, status: "Not Started", body: null },
      { key: "conditionsRenovation", title: NARR_TITLES.conditionsRenovation, status: "Not Started", body: null },
    ],
  },
  {
    id: "elmgrove",
    tradeName: "Elm Grove Residences",
    legalEntity: "Elm Grove Residences (NC), LLC",
    manager: "Meridian Residential",
    addressLine: "6300 Falls of Neuse Rd",
    cityStateZip: "Raleigh, NC 27615",
    submarket: "North Raleigh",
    units: 275,
    totalSqFt: 233750,
    // Only the latest quarter exists for this property, exercising disabled
    // quarter chips and a holding set that changes between quarters.
    quarters: ["2026-q1"],
    incomeCur: { rentalIncome: 990000, otherResidentIncome: 48000, otherPropertyIncome: 20000 },
    expenseCur: {
      fixedExpenses: 130000, repairsMaintenance: 88000, utilities: 110000, gAndA: 44000,
      marketing: 26000, makeReadyTurnover: 16000, professionalServices: 7000, payrollLabor: 175000,
    },
    rr: {
      occupied: 261, totalMarketRent: 412000, totalInPlaceRent: 384000,
      avgUnitSqFt: 850, avgUnitRent: 1396, avgOccupiedUnitRent: 1471, avgResidentRent: 1440,
    },
    leasingQ1: { moveIns: 22, moveOuts: 19, noticesToVacate: 18, unitsRented: 30, renewals: 26, evictions: 1 },
    occ2025: OCC.elmgrove2025,
    occ2026: OCC.elmgrove2026,
    narrativeQ1: [
      { key: "marketCommentary", title: NARR_TITLES.marketCommentary, status: "Completed", body: "North Raleigh fundamentals firm. Employment growth continues to support demand across the submarket." },
      { key: "propertyOperations", title: NARR_TITLES.propertyOperations, status: "Work in Progress", body: "Staffing back to full after a Q4 vacancy. Renewal outreach cadence being tightened." },
      { key: "conditionsRenovation", title: NARR_TITLES.conditionsRenovation, status: "Gathering Info", body: null },
    ],
  },
];

function parseCityState(cityStateZip) {
  const [cityPart, rest] = cityStateZip.split(",");
  const state = (rest ?? "").trim().split(/\s+/)[0] ?? "";
  return { city: (cityPart ?? "").trim(), state };
}

// ---- write ----
rmSync(FIX, { recursive: true, force: true });
mkdirSync(FIX, { recursive: true });

const manifestProperties = [];
for (const seed of SEEDS) {
  mkdirSync(join(FIX, seed.id), { recursive: true });
  for (const q of seed.quarters) {
    const report = reportFor(seed, q);
    writeFileSync(
      join(FIX, seed.id, `${q}.json`),
      JSON.stringify(report, null, 2) + "\n",
    );
  }
  const latestQuarter = seed.quarters[seed.quarters.length - 1];
  const latest = reportFor(seed, latestQuarter);
  const { city, state } = parseCityState(seed.cityStateZip);
  manifestProperties.push({
    propertyId: seed.id,
    tradeName: seed.tradeName,
    city,
    state,
    availableQuarters: [...seed.quarters].sort(
      (a, b) => QUARTER_ORDER.indexOf(a) - QUARTER_ORDER.indexOf(b),
    ),
    latestNoi: latest.operatingStatement.netOperatingIncome.ptdCurrent,
  });
}

writeFileSync(
  join(FIX, "manifest.json"),
  JSON.stringify(
    { quarters: QUARTER_ORDER, properties: manifestProperties },
    null,
    2,
  ) + "\n",
);

console.log(
  `Wrote fixtures for ${SEEDS.length} properties across ${QUARTER_ORDER.length} quarters, plus manifest.json`,
);
