# 03. Quarterly Report Spec

The primary surface. Every section, in order, with the exact design-system component and asset to use. Component names, tokens, and asset primitives come from `DESIGN_GUIDELINES.md` (referenced as DG). Data comes from `02_DATA_MODEL.md` (referenced as DM).

> No em dashes. Compose all labels from structured data (DM section 6), do not carry source em dashes into the UI.

---

## 1. Report layout, top to bottom

1. Report header and property identity
2. Top-line KPI row (with YoY)
3. Operating Statement (PTD + YTD, current vs prior year, %Δ)
4. Performance visuals (income/expense/NOI, opex breakdown)
5. Rent Roll Summary
6. Leasing Activity
7. 12-month occupancy trend (current + prior year)
8. Narrative sections (read-only + status)
9. Property images
10. Audit and provenance
11. Export bar (Excel, PDF)

The holding variant swaps sections 8 and 9 for a portfolio composition block (section 13).

Each section is a `Panel` (DG 9.3) with a mono eyebrow, a serif title, and its content. Section rhythm 48-72px. Everything sits in the guideline container width.

---

## 2. Report header and property identity

- **Eyebrow** (mono, accent, DG 8.8): the composed period label, for example `QUARTERLY OPERATING REPORT · 2026 · QUARTER 1 · JANUARY TO MARCH 2026`. Built from `meta`, no em dash.
- **Title** (serif `display-lg`, DG 2.3): `identity.tradeName`, for example `Universe at Acacia`.
- **Identity grid** below the title: a two or three column grid of labeled facts. Each fact is a mono label (`LEGAL ENTITY`, `MANAGER`, `LOCATION`, `UNITS / SF`, `ACCOUNTING BASIS`) with a sans value beneath. Values: legal entity, manager, `addressLine` + `cityStateZip` (+ submarket as a muted suffix), `units units · totalSqFt SF` (formatted), `Cash`.
- A hairline divider closes the identity block.

Holding view header: title `All Holdings`, eyebrow `PORTFOLIO ROLL-UP · <period>`, identity grid becomes portfolio facts (property count, total units, total SF, markets count).

## 3. Top-line KPI row

Four `KpiCard`s (DG 9.2) in a row (4-up desktop, 2-up tablet, 1-up mobile).

| Card | Value | Sub-caption | YoY |
| --- | --- | --- | --- |
| Total Income (PTD) | `money(totalIncome.ptdCurrent)` | `+X.X% YoY` | higherIsBetter coloring |
| Total OpEx (PTD) | `money(totalOperatingExpenses.ptdCurrent)` | `+X.X% YoY` | lowerIsBetter coloring |
| NOI (PTD) | `money(netOperatingIncome.ptdCurrent)` | `+X.X% YoY` | higherIsBetter coloring |
| Physical Occupancy | `percent(rentRoll.physicalOccupancy)` | `occupiedUnits/totalUnits units` | show delta vs prior-year occupancy if available, higherIsBetter |

- KPI value: sans, weight 600, tabular, `--color-text-serif` (DG 9.2).
- YoY sub-caption: mono caption with the arrow and semantic color from DM section 5. Example: `NOI (PTD) $550,205` with `-31.8% YoY` down-arrow in `neg`.
- On value change (quarter or scope switch), roll the number with a spring, keep tabular width (DG 7.3).

## 4. Operating Statement

The centerpiece table. Reuse `DataTable` styling (DG 9.4) with a financial-statement structure.

### 4.1 Columns

```
Account            | Period-to-Date               | Year-to-Date
                   | Q1 2025 | Q1 2026 | %Δ        | Q1 2025 | Q1 2026 | %Δ
```

- Group headers `PERIOD-TO-DATE` and `YEAR-TO-DATE` span their three sub-columns (mono, muted, DG 9.4 header style).
- Sub-headers `Q1 2025`, `Q1 2026`, `%Δ` derived from `meta` (prior label, current label). Numeric columns right-aligned, tabular.
- The Account column is left-aligned sans; group rows (`INCOME`, `OPERATING EXPENSES`) are mono uppercase labels, muted.

### 4.2 Rows

- Income lines, then `Total Income` (subtotal: hairline-strong top border, weight 600).
- Expense lines, then `Total Operating Expenses` (subtotal).
- `Net Operating Income` (result: heavier weight, a hairline-strong rule above, may sit in `--color-pos-soft` if positive to signal the bottom line).
- Each `%Δ` cell: signed one-decimal percent, arrow, semantic color by favorability (DM section 5). Null renders `n/a` muted.
- Optional: on hover of a line label, a tooltip shows the GL code (`glCode`) for auditability.

### 4.3 Behavior

- No zebra striping, hairline row dividers only.
- The table is not paginated (line count is small and fixed). It is fully visible.
- Values animate on scope/quarter change with a subtle fade, tabular width preserved.

## 5. Performance visuals

Two panels side by side (collapse to stacked on narrow). These use the asset library (DG section 8), not a generic chart lib default.

### 5.1 Income, Expenses, NOI (horizontal brick bars)

- Three rows: Total Income, Total Operating Expenses, Net Operating Income.
- Horizontal brick bar per row (DG 8.2), each square a quantum of dollars, scaled to the largest of the three.
- Color: Income row `pos`, OpEx row `warn` or `neg` context, NOI row `pos` if positive. Keep the mapping consistent with the semantic vocabulary.
- Value label right, `money()`, tabular.

### 5.2 Operating expense breakdown (waffle + legend)

- A waffle grid (bricks, DG 8.1) where each brick is a share of total OpEx, colored by expense category using the categorical palette (DG 3.5), assigned in a fixed order.
- A legend (DG 8.7): colored square + category label + percent of OpEx, right of or below the waffle.
- `TOTAL OPEX: money(totalOperatingExpenses.ptdCurrent)` as a mono caption beneath.
- Categories and percents computed from the expense lines.

## 6. Rent Roll Summary

- A `Panel` with a labeled metric grid (like the KPI style but denser, DG 9.2 caption + value pattern), two or three columns.
- Metrics in order: Total Units, Occupied Units, Vacant Units, Physical Occupancy, Total SF, Avg Unit Sq Ft, Avg Unit Rent, Avg Occupied Unit Rent, Avg Resident Rent, Total Market Rent, Total Unit Rent (in place), Economic Occupancy.
- Occupancy metrics formatted with `percent()`. Rents and market rent with `money()`. Counts with `count()`.
- Eyebrow shows the as-of date: `RENT ROLL SUMMARY · AS OF 03/31/2026` (composed, no em dash).
- Physical Occupancy and Economic Occupancy can carry a small semantic color chip (green at or above 95, amber 90-95, coral below 90) to echo the vocabulary.

## 7. Leasing Activity

Two parts, side by side on desktop.

### 7.1 Metric tiles

Seven small tiles (DG 9.2 compact): Move-Ins, Move-Outs, Net Absorption, Notices to Vacate, Units Rented, Renewals, Evictions. Net Absorption shows a signed value (`+5`) with semantic color (positive `pos`).

### 7.2 Funnel (horizontal brick bars)

- Rows: Move-ins, Move-outs, Notices, Renewals, Evictions, each a horizontal brick bar scaled to the max.
- Move-ins and Renewals in `pos`, Move-outs and Notices in `warn`, Evictions in `neg`. This mirrors the reference product's leasing funnel.
- Right-aligned counts.

## 8. 12-month occupancy trend

- A line chart (DG 8.6) with two series: current year (solid line, `pos`) and prior year (a quieter line, muted or `info`).
- X axis Jan to Dec (mono caption). Y axis percentage band around the data (for example 88 to 99 percent) so movement reads.
- Future months of the current year are absent (null), so the current-year line stops at the latest reported month. Annotate the latest actual point (`May: 93.5%`).
- Optional dashed target line if the client sets an occupancy target (not in the sample, leave a prop for it).
- Legend chips (DG 8.7): current year, prior year.

## 9. Narrative sections (read-only, Phase 1)

Three sections in order: Market Commentary, Property Operations, Property Conditions & Renovation Plans.

- Each is a `Panel` with a serif title and a status tag (DG 9.9) top-right reflecting `status`:
  - Completed: `pos-soft` background, `pos` text, label `COMPLETED`.
  - Work in Progress: `warn-soft`, `warn`, `WORK IN PROGRESS`.
  - Gathering Info: `info-soft`, `info`, `GATHERING INFO`.
  - Not Started: `--color-faint` text on transparent, `NOT STARTED`.
- If `body` is present, render it as sans prose (`body-lg`, comfortable leading). Normalize em dashes on the way in.
- If `body` is null, render the authoring placeholder (DG 9.7): italic muted `Not yet written`. Phase 1 is read-only, so no click-to-author, but keep the block obviously reserved for content.

## 10. Property images

- Two slots (DG treats these as reserved surfaces): Property Photo, Aerial / Site Map.
- If `url` present, render the image in a bordered frame, radius `sm`, with a subtle border. Lazy-load.
- If null, render a quiet empty slot: dashed border (DG import-zone style), centered mono caption `PROPERTY PHOTO` / `AERIAL / SITE MAP`. No error tone, just reserved space.
- Holding view omits this section.

## 11. Audit and provenance

- A `Panel`, eyebrow `AUDIT & PROVENANCE`, no serif title needed (or a small one).
- The `provenance` entries as a quiet list, mono caption or small sans, `--color-muted`, each line prefixed with a middot (`·`). These lines are the credibility of the report, render them faithfully (only em-dash normalized).
- Keep this section low-contrast and understated. It is reference material, not a headline.

## 12. Export bar

- A slim bar (sticky at the report top or fixed at the report header, near the title) with two quiet buttons (DG 9.8): `EXPORT EXCEL` and `EXPORT PDF`, each with a trailing arrow or a thin download icon.
- On click, generate and download per `04_EXPORT_SPEC.md`. Show an inline progress state on the button (mono `PREPARING`) and never block the whole report.
- Placement: top-right of the report header block, aligned with the title. On narrow screens it moves below the identity grid.

---

## 13. Holding (All Holdings) variant

Same skeleton, three differences.

1. **Identity** becomes a portfolio summary (DM 4.2): `All Holdings · 52 properties`, total units, total SF, markets.
2. **KPIs and Operating Statement** render the rolled-up figures (DM 4.1). YoY at roll-up level.
3. **Sections 8 (narrative) and 9 (images) are replaced by a Portfolio Composition block**, reusing the reference product's portfolio visuals:
   - **NOI by property**: a ranked list of horizontal brick bars (DG 8.2), one per property, colored by that property's occupancy band, value right-aligned. This is the reference product's signature "NOI by property" panel.
   - **Occupancy vs NOI per unit**: a scatter plot (DG 8.3), one dot per property, colored by occupancy band. Dots that link to a property report get a hover ring and navigate on click (honest affordance).
   - **All properties table**: a sortable `DataTable` (DG 9.4) with property, location, units, quarter NOI, quarter occupancy, and YoY NOI. Sort controls: NOI, Occupancy, Name. Rows link to the property's report for the same quarter.
- Rent Roll Summary and Leasing Activity still render, rolled up.
- 12-month occupancy trend renders the unit-weighted portfolio series.

The holding report is therefore both a financial roll-up and the portfolio overview, which folds the reference product's Portfolio page into the Quarterly Report as its All Holdings view.

---

## 14. Cross-cutting rules

- Every section is independently loadable and independently handles the four states (IA doc section 4). A missing narrative does not blank the financials.
- All numbers tabular, all money and percent through the shared formatters (DM section 6).
- One motion budget per view: a single staggered reveal of sections on load (DG 7.3), not per-scroll animation. Value roll-ups on scope/quarter change.
- The report is print-clean: a print stylesheet lays it out for PDF (see export doc), hiding the shell chrome and the export bar.
