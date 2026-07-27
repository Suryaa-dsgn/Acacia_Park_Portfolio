# 02. Data Model

The typed contract the UI renders. Derived from the governed / scrubbed report (`Acacia_Q1_2026_Quarterly_Narrative_SCRUBBED.xlsx`). The UI reads only this contract, never a raw export. Swapping the data source (fixture JSON now, API later) must not touch components.

> No em dashes. All display strings are normalized to strip em dashes on the way in (section 6).

---

## 1. Top-level shape

One governed report per (property or holding) per quarter.

```ts
type QuarterId = string;   // "2026-q1", lowercase, hyphen
type PropertyId = string;  // stable governed code, e.g. "acacia"

interface QuarterlyReport {
  meta: ReportMeta;
  identity: PropertyIdentity;      // property view: the property; holding view: portfolio summary
  operatingStatement: OperatingStatement;
  rentRoll: RentRollSummary;
  leasing: LeasingActivity;
  occupancySeries: OccupancySeries; // current year + prior year, monthly
  narrative: NarrativeSection[];    // omitted or replaced in holding view (see section 4)
  images: ReportImage[];            // property view only
  provenance: ProvenanceEntry[];
  scope: Scope;                     // "holding" | { propertyId }
}
```

## 2. Sections

### 2.1 ReportMeta

```ts
interface ReportMeta {
  quarter: QuarterId;          // "2026-q1"
  quarterLabel: string;        // "Q1'26" (UI derives short + long forms)
  fiscalYear: number;          // 2026
  quarterNumber: 1 | 2 | 3 | 4;
  periodStart: string;         // ISO date, "2026-01-01"
  periodEnd: string;           // ISO date, "2026-03-31"
  priorPeriodStart: string;    // "2025-01-01"
  priorPeriodEnd: string;      // "2025-03-31"
  accountingBasis: "Cash" | "Accrual";
  rentRollAsOf: string;        // ISO date, "2026-03-31"
  generatedAt: string;         // ISO datetime
}
```

Display note: source labels the period like `2026 - Quarter 1 · January to March 2026`. Compose this in the UI from the fields above. Do not carry the source's em dash.

### 2.2 PropertyIdentity

```ts
interface PropertyIdentity {
  tradeName: string;      // "Universe at Acacia" / "Acacia Grove"
  legalEntity: string;    // "Universe at Acacia (DE), LLC"
  manager: string;        // "Meridian Residential"
  addressLine: string;    // "5280 N Little Mountain Dr"
  cityStateZip: string;   // "San Bernardino, CA 92407"
  submarket: string | null; // "Inland Empire"
  units: number;          // 304
  totalSqFt: number;      // 258400
}
```

Holding view supplies a portfolio-level identity instead (section 4).

### 2.3 OperatingStatement

The core table. Each line has a current value, a prior-year value, and a computed %Δ, for both PTD and YTD. In Q1 the PTD and YTD values are equal (the sample confirms this); they diverge in later quarters, so keep both columns.

```ts
interface StatementLine {
  key: string;            // stable, e.g. "rentalIncome"
  label: string;          // "Rental Income"
  glCode?: string;        // "4300-0000" (optional, for audit tooltip)
  ptdCurrent: number;
  ptdPrior: number;
  ytdCurrent: number;
  ytdPrior: number;
  // %Δ is computed, not stored (section 5). Store only if the governed source
  // provides an authoritative value that must be shown verbatim.
  isSubtotal?: boolean;   // Total Income, Total Operating Expenses
  isResult?: boolean;     // Net Operating Income
  favorability: "higherIsBetter" | "lowerIsBetter"; // drives YoY color
}

interface OperatingStatement {
  income: StatementLine[];       // rentalIncome, otherResidentIncome, otherPropertyIncome
  totalIncome: StatementLine;    // isSubtotal, higherIsBetter
  expenses: StatementLine[];     // fixed, repairsMaintenance, utilities, gAndA,
                                 // marketing, makeReadyTurnover, professionalServices, payrollLabor
  totalOperatingExpenses: StatementLine; // isSubtotal, lowerIsBetter
  netOperatingIncome: StatementLine;     // isResult, higherIsBetter
}
```

Line item set and favorability (from the governed file):

| key | label | favorability |
| --- | --- | --- |
| rentalIncome | Rental Income | higherIsBetter |
| otherResidentIncome | Other Resident Income | higherIsBetter |
| otherPropertyIncome | Other Property Income | higherIsBetter |
| totalIncome | Total Income | higherIsBetter |
| fixedExpenses | Fixed Expenses | lowerIsBetter |
| repairsMaintenance | Repairs & Maintenance | lowerIsBetter |
| utilities | Utilities | lowerIsBetter |
| gAndA | General & Administrative | lowerIsBetter |
| marketing | Marketing | lowerIsBetter |
| makeReadyTurnover | Make Ready / Turnover | lowerIsBetter |
| professionalServices | Professional Services | lowerIsBetter |
| payrollLabor | Payroll / Labor | lowerIsBetter |
| totalOperatingExpenses | Total Operating Expenses | lowerIsBetter |
| netOperatingIncome | Net Operating Income | higherIsBetter |

Sample values (Q1 2026 governed, use as fixture): Total Income 1,769,661.34 (prior 1,669,096.26); Total Operating Expenses 1,219,456.58 (prior 862,475.49); NOI 550,204.76 (prior 806,620.77). These are real figures from the file; label them fixture data in code.

### 2.4 RentRollSummary

```ts
interface RentRollSummary {
  asOf: string;              // "2026-03-31"
  totalUnits: number;        // 304
  occupiedUnits: number;     // 291
  vacantUnits: number;       // 13
  physicalOccupancy: number; // 0.957237 (store as fraction)
  totalSqFt: number;         // 258400
  avgUnitSqFt: number;       // 850
  avgUnitRent: number;       // 1811
  avgOccupiedUnitRent: number; // 1952.81
  avgResidentRent: number;   // 1876.95
  totalMarketRent: number;   // 593657
  totalInPlaceRent: number;  // 550544  (labeled "Total Unit Rent (in place)")
  economicOccupancy: number; // 0.927377 (store as fraction)
}
```

Store occupancy values as fractions (`0.957237`), format as `95.7%` in the UI.

### 2.5 LeasingActivity

```ts
interface LeasingActivity {
  moveIns: number;        // 28
  moveOuts: number;       // 23
  netAbsorption: number;  // 5  (moveIns - moveOuts)
  noticesToVacate: number;// 22
  unitsRented: number;    // 57
  renewals: number;       // 48
  evictions: number;      // 2
}
```

### 2.6 OccupancySeries

Monthly physical occupancy, current year and prior year, twelve slots each. Future months in the current year are null (not yet occurred).

```ts
interface OccupancySeries {
  currentYear: number;                 // 2026
  priorYear: number;                   // 2025
  current: (number | null)[];          // length 12, fractions, null for future months
  prior: (number | null)[];            // length 12
}
```

Sample current (2026): Jan 0.9312, Feb 0.9397, Mar 0.9402, Apr 0.9359, May 0.9349, Jun..Dec null. Prior (2025) is fully populated.

### 2.7 NarrativeSection

```ts
type NarrativeStatus = "Completed" | "Work in Progress" | "Gathering Info" | "Not Started";

interface NarrativeSection {
  key: "marketCommentary" | "propertyOperations" | "conditionsRenovation";
  title: string;          // "Market Commentary"
  body: string | null;    // authored prose, or null if unwritten
  status: NarrativeStatus;
}
```

The status enum matches the governed file's Lists sheet. Phase 1 renders these read-only with the status tag (design guideline 9.7 and 9.9).

### 2.8 ReportImage

```ts
interface ReportImage {
  slot: "propertyPhoto" | "aerialSiteMap";
  url: string | null;     // null renders the empty slot
  alt: string;
}
```

### 2.9 ProvenanceEntry

```ts
interface ProvenanceEntry {
  text: string;           // one audit line, normalized (no em dash)
  sourceRef?: string;     // optional machine ref for tooltips
}
```

Rendered in the Audit & Provenance section as a quiet list. These lines carry the report's credibility, keep them intact except for em-dash normalization.

## 3. Property list (navigator)

```ts
interface PropertyListItem {
  propertyId: PropertyId;
  tradeName: string;
  city: string;
  state: string;
  availableQuarters: QuarterId[]; // for disabling quarter chips
  latestNoi?: number;             // optional, for future sorting
}
```

## 4. Holding (All Holdings) roll-up

The roll-up is a `QuarterlyReport` with `scope: "holding"`, assembled from every property's report for that quarter.

### 4.1 Aggregation rules (per field)

| Field | Rule |
| --- | --- |
| All operating-statement lines (income, expenses, totals, NOI), PTD and YTD, current and prior | **Sum** across properties |
| units, totalSqFt, occupiedUnits, vacantUnits | **Sum** |
| totalMarketRent, totalInPlaceRent | **Sum** |
| moveIns, moveOuts, netAbsorption, noticesToVacate, unitsRented, renewals, evictions | **Sum** |
| physicalOccupancy | **Derived:** sum(occupiedUnits) / sum(totalUnits) |
| economicOccupancy | **Derived:** sum(totalInPlaceRent) / sum(totalMarketRent) |
| avgUnitSqFt | **Derived:** sum(totalSqFt) / sum(units) |
| avgUnitRent | **Derived:** sum(totalInPlaceRent) / sum(units) |
| avgOccupiedUnitRent | **Confirm.** Provisional: sum(totalInPlaceRent) / sum(occupiedUnits). Flag as computed until the partner confirms the governed definition. |
| avgResidentRent | **Confirm.** Same caution as above. |
| occupancySeries (each month) | **Derived:** unit-weighted average across properties with data that month |
| YoY %Δ (all) | Computed on the rolled-up totals, not averaged from per-property percentages (section 5) |

Guard every derived denominator against zero.

### 4.2 Holding identity and narrative

- `identity` becomes a **portfolio summary**: property count, total units, total SF, list of markets. Compose a holding label such as `All Holdings · 52 properties`.
- `narrative` sections are omitted at holding level. In their place the holding report shows a **portfolio composition** block (see `03_QUARTERLY_REPORT_SPEC.md`, section on the holding variant): NOI by property (brick bars), occupancy distribution (scatter), and a compact all-properties table. This reuses the reference product's portfolio visuals.
- `images` are omitted at holding level.
- `provenance` becomes a portfolio-level statement (governed roll-up of N property reports for the quarter).

## 5. YoY computation

```ts
function pctChange(current: number, prior: number): number | null {
  if (prior === 0) return null; // render "n/a", never divide by zero
  return (current - prior) / prior;
}
```

Display:
- Format one decimal, signed: `+2.7%`, `-31.8%`. Null renders `n/a`.
- **Arrow** reflects the value direction: up for positive change, down for negative.
- **Color** reflects favorability, not raw direction:
  - `higherIsBetter` line: positive change is `pos` (green), negative is `neg` (coral).
  - `lowerIsBetter` line: positive change is `neg` (coral), negative is `pos` (green).
  - Example: Total Operating Expenses rising YoY shows an up arrow colored coral (an increase in cost is unfavorable). NOI falling shows a down arrow colored coral.
- If the governed source supplies its own %Δ that must be shown verbatim, prefer it and note the source; otherwise compute.

## 6. Formatting and normalization (shared utilities)

Build these once in `lib/format.ts` and use everywhere. Numbers use `tabular-nums`.

```ts
money(n)      // 1769661.34 -> "$1,769,661"   (no decimals for whole-dollar display)
moneyExact(n) // -> "$1,769,661.34" where cents matter (rare, exports)
percent(f)    // 0.957237   -> "95.7%"        (one decimal, input is a fraction)
signedPct(f)  // 0.027      -> "+2.7%"
ratio(n)      // 0.92       -> "0.92×"         (multiplication sign U+00D7)
count(n)      // 291        -> "291"
delta(n)      // 5          -> "+5" / "-3"
```

Negative money renders with a leading minus and semantic color where it denotes a loss, for example Net Income `-$411,459` in `neg`.

**Em-dash normalization (required).** Governed strings contain em dashes and en dashes (`2026 — QUARTER 1`, `January–March`, `Month — 2026`). Normalize all display text on ingestion:

```ts
function normalizeText(s: string): string {
  return s
    .replace(/\s*—\s*/g, ": ")   // em dash -> colon+space, tune per context
    .replace(/–/g, "-")           // en dash -> hyphen (ranges)
    .replace(/\u00a0/g, " ")      // non-breaking space -> space
    .replace(/\s+/g, " ")
    .trim();
}
```

Apply context-aware replacement where a colon is wrong (a range wants `to` or a hyphen, an aside wants a comma). For fixed composed strings (period labels, section headers) build them from structured fields rather than normalizing source prose, so the output is clean by construction.

## 7. Fixture strategy (Phase 1)

- Hand-build `fixtures/acacia/2026-q1.json` from the sample governed file (values above), matching the contract exactly.
- Add 3-4 more fixture properties and 2-3 quarters so the navigator, quarter selector, YoY, and roll-up are all exercisable. Vary occupancy bands so all four semantic colors appear.
- Build one `fixtures/holding/2026-q1.json` by running the aggregation rules over the property fixtures, so the roll-up path is real, not faked.
- A single `dataSource` module resolves `(scope, quarter)` to a `QuarterlyReport`. Phase 1 reads fixtures. Later it calls the API. Components never know which.

```ts
interface DataSource {
  listProperties(): Promise<PropertyListItem[]>;
  getReport(scope: Scope, quarter: QuarterId): Promise<QuarterlyReport | null>;
  availableQuarters(scope: Scope): Promise<QuarterId[]>;
}
```
