// lib/types.ts
// The typed data contract the UI renders (DM sections 1-4). The UI reads only
// this contract, never a raw export. Swapping the data source (fixture JSON now,
// API later) must not touch components. All display strings are normalized to
// strip em dashes on the way in (see lib/normalize.ts).

export type QuarterId = string; // "2026-q1", lowercase, hyphen
export type PropertyId = string; // stable governed code, e.g. "acacia"

export type Scope =
  | { kind: "holding" }
  | { kind: "property"; propertyId: PropertyId };

// ---------------------------------------------------------------------------
// Report meta
// ---------------------------------------------------------------------------

export interface ReportMeta {
  quarter: QuarterId; // "2026-q1"
  quarterLabel: string; // "Q1'26"
  fiscalYear: number; // 2026
  quarterNumber: 1 | 2 | 3 | 4;
  periodStart: string; // ISO date, "2026-01-01"
  periodEnd: string; // ISO date, "2026-03-31"
  priorPeriodStart: string; // "2025-01-01"
  priorPeriodEnd: string; // "2025-03-31"
  accountingBasis: "Cash" | "Accrual";
  rentRollAsOf: string; // ISO date, "2026-03-31"
  generatedAt: string; // ISO datetime
}

// ---------------------------------------------------------------------------
// Identity (property view: the property; holding view: portfolio summary)
// ---------------------------------------------------------------------------

export interface PropertyIdentity {
  kind: "property";
  tradeName: string; // "Universe at Acacia"
  legalEntity: string; // "Universe at Acacia (DE), LLC"
  manager: string; // "Meridian Residential"
  addressLine: string; // "5280 N Little Mountain Dr"
  cityStateZip: string; // "San Bernardino, CA 92407"
  submarket: string | null; // "Inland Empire"
  units: number; // 304
  totalSqFt: number; // 258400
}

export interface HoldingIdentity {
  kind: "holding";
  label: string; // "All Holdings: 5 properties"
  propertyCount: number;
  totalUnits: number;
  totalSqFt: number;
  markets: string[]; // distinct submarkets or metros
}

export type ReportIdentity = PropertyIdentity | HoldingIdentity;

// ---------------------------------------------------------------------------
// Operating statement
// ---------------------------------------------------------------------------

export type Favorability = "higherIsBetter" | "lowerIsBetter";

export interface StatementLine {
  key: string; // stable, e.g. "rentalIncome"
  label: string; // "Rental Income"
  glCode?: string; // "4300-0000" (optional, for audit tooltip)
  ptdCurrent: number;
  ptdPrior: number;
  ytdCurrent: number;
  ytdPrior: number;
  isSubtotal?: boolean; // Total Income, Total Operating Expenses
  isResult?: boolean; // Net Operating Income
  favorability: Favorability; // drives YoY color
}

export interface OperatingStatement {
  income: StatementLine[]; // rentalIncome, otherResidentIncome, otherPropertyIncome
  totalIncome: StatementLine; // isSubtotal, higherIsBetter
  expenses: StatementLine[]; // fixed, repairsMaintenance, utilities, gAndA,
  // marketing, makeReadyTurnover, professionalServices, payrollLabor
  totalOperatingExpenses: StatementLine; // isSubtotal, lowerIsBetter
  netOperatingIncome: StatementLine; // isResult, higherIsBetter
}

// ---------------------------------------------------------------------------
// Rent roll, leasing, occupancy
// ---------------------------------------------------------------------------

export interface RentRollSummary {
  asOf: string; // "2026-03-31"
  totalUnits: number; // 304
  occupiedUnits: number; // 291
  vacantUnits: number; // 13
  physicalOccupancy: number; // 0.957237 (fraction)
  totalSqFt: number; // 258400
  avgUnitSqFt: number; // 850
  avgUnitRent: number; // 1811
  avgOccupiedUnitRent: number; // 1952.81
  avgResidentRent: number; // 1876.95
  totalMarketRent: number; // 593657
  totalInPlaceRent: number; // 550544
  economicOccupancy: number; // 0.927377 (fraction)
}

export interface LeasingActivity {
  moveIns: number; // 28
  moveOuts: number; // 23
  netAbsorption: number; // 5 (moveIns - moveOuts)
  noticesToVacate: number; // 22
  unitsRented: number; // 57
  renewals: number; // 48
  evictions: number; // 2
}

export interface OccupancySeries {
  currentYear: number; // 2026
  priorYear: number; // 2025
  current: (number | null)[]; // length 12, fractions, null for future months
  prior: (number | null)[]; // length 12
}

// ---------------------------------------------------------------------------
// Narrative, images, provenance
// ---------------------------------------------------------------------------

export type NarrativeStatus =
  | "Completed"
  | "Work in Progress"
  | "Gathering Info"
  | "Not Started";

export interface NarrativeSection {
  key: "marketCommentary" | "propertyOperations" | "conditionsRenovation";
  title: string; // "Market Commentary"
  body: string | null; // authored prose, or null if unwritten
  status: NarrativeStatus;
}

export interface ReportImage {
  slot: "propertyPhoto" | "aerialSiteMap";
  url: string | null; // null renders the empty slot
  alt: string;
}

export interface ProvenanceEntry {
  text: string; // one audit line, normalized (no em dash)
  sourceRef?: string; // optional machine ref for tooltips
}

// ---------------------------------------------------------------------------
// Holding composition (portfolio overview data, DM 4.2)
// ---------------------------------------------------------------------------

export interface PropertyComposition {
  propertyId: PropertyId;
  tradeName: string;
  city: string;
  state: string;
  units: number;
  noi: number; // quarter NOI (PTD current)
  occupancy: number; // physical occupancy fraction
  yoyNoi: number | null; // YoY NOI change, null when prior is zero
}

export interface HoldingComposition {
  properties: PropertyComposition[];
}

// ---------------------------------------------------------------------------
// The report
// ---------------------------------------------------------------------------

export interface QuarterlyReport {
  meta: ReportMeta;
  identity: ReportIdentity;
  operatingStatement: OperatingStatement;
  rentRoll: RentRollSummary;
  leasing: LeasingActivity;
  occupancySeries: OccupancySeries;
  narrative: NarrativeSection[] | null; // null at holding level
  images: ReportImage[] | null; // null at holding level
  provenance: ProvenanceEntry[];
  composition?: HoldingComposition; // present at holding level only
  scope: Scope;
}

// ---------------------------------------------------------------------------
// Navigator
// ---------------------------------------------------------------------------

export interface PropertyListItem {
  propertyId: PropertyId;
  tradeName: string;
  city: string;
  state: string;
  availableQuarters: QuarterId[]; // for disabling quarter chips
  latestNoi?: number; // optional, for future sorting
}
