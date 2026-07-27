# 04. Export Spec

The current report (single property or All Holdings, current quarter) exports to Excel and PDF. Both are faithful to what is on screen and carry the provenance. References: `02_DATA_MODEL.md` (DM), `03_QUARTERLY_REPORT_SPEC.md` (report spec).

> No em dashes in any exported label, sheet name, or cell. Compose from structured fields.

---

## 1. Shared principles

- Export reflects the **current view state** (scope + quarter). The export buttons live in the report export bar (report spec section 12).
- Both formats include the same content as the on-screen report: identity, operating statement (PTD + YTD, prior + current + %Δ), rent roll summary, leasing activity, occupancy series, narrative (authored text and status), and the audit/provenance lines.
- File naming: `<tradeNameSlug>_<quarter>_quarterly-report.<ext>`, for example `universe-at-acacia_2026-q1_quarterly-report.xlsx`. Holding: `all-holdings_2026-q1_quarterly-report.xlsx`.
- Generation must not block the UI. Show a progress state on the button, then trigger the download.

## 2. Excel export

### 2.1 Approach

- Generate server-side or in a worker. The governed file uses **live Excel formulas** for derived cells (`%Δ`, subtotals, NOI, occupancy). Match that: write inputs as values and derived cells as formulas, so the workbook recalculates if a value is edited. Do not hardcode a computed result where a formula belongs.
- Prefer widely supported functions. For a lookup or conditional use `INDEX`/`MATCH`, `IFERROR`, `SUMIFS`. Avoid `XLOOKUP`, `FILTER`, `UNIQUE`, `SORT`, `SEQUENCE` and other newer spilling functions, which do not survive a headless recalc reliably.
- Professional font throughout (Arial or the workbook's existing convention). Currency `$#,##0`, percentages stored as fractions formatted `0.0%`, ratios `0.0x`, negatives in parentheses, zeros as `-`.

### 2.2 Sheet structure

Mirror the governed file so the client recognizes it.

1. **Sheet `<Quarter> Narrative`** (for example `Q1 2026 Narrative`):
   - Property identity block.
   - Operating Statement: Account, PTD (prior, current, %Δ), YTD (prior, current, %Δ). Subtotals and NOI as **formulas** (`=SUM(...)`, `=current-prior`, `%Δ = IFERROR((current-prior)/prior, "")`). Reference input cells, never literals.
   - Rent Roll Summary block.
   - Leasing Activity block.
   - Narrative sections: title, status, authored body (or a `Not yet written` note).
   - Audit and Provenance lines.
2. **Sheet `Occupancy <priorYear> and <year>`**: the monthly occupancy matrix, prior year and current year, months as columns, future months as `-`.

Holding export: the same two sheets with rolled-up values, identity replaced by the portfolio summary, and the Portfolio Composition data (per-property NOI and occupancy) added as a third sheet `Properties` (property, location, units, NOI, occupancy, YoY NOI), computed and sorted in code before writing.

### 2.3 Correctness

- After generating, recalculate headlessly and confirm zero formula errors before offering the download. A green recalc proves formulas evaluate, it does not prove they are right, so verify two or three key cells (Total Income, NOI, a %Δ) against the on-screen values.
- Document any assumption or hardcoded number in an adjacent cell or a comment, citing the governed source (mirroring the provenance lines).

## 3. PDF export

### 3.1 Approach

Two viable paths, pick per stack:

- **Print stylesheet + headless print** (recommended for fidelity): a dedicated print CSS lays out the report for paper, and a headless browser prints to PDF. This reuses the exact React components, so the PDF matches the screen.
- **Server-side render to PDF** with a layout component if a print pipeline is not available.

Either way the PDF is **not** a screenshot. It is laid-out, selectable-text, print-quality.

### 3.2 Print layout rules

- Hide the app shell: no left navigator, no quarter selector, no header nav, no export bar. Print only the report.
- Page size Letter (US client) by default, with sensible margins. Provide a title block at the top of page one: brand lockup, property (or All Holdings), period label, generated date.
- Repeat a slim running header on each page (property + quarter) and a running footer (page number + the governed data-source line).
- Force sensible page breaks: keep the Operating Statement together where possible, avoid orphaning a section title from its content (`break-inside: avoid` on panels, `break-after: avoid` on titles).
- Use the **light theme** tokens for print regardless of the on-screen theme (paper is white, ink is dark). This is where the light-mode palette earns its place. Charts render in their light-mode colors.
- Charts and brick visuals must render crisply in print (SVG, not canvas rasterization, so vector output stays sharp).
- Narrative sections print their authored text; unwritten sections print the status and a `Not yet written` note rather than being hidden, so the reader sees what is pending.
- The audit and provenance section always prints. It is the report's credibility.

### 3.3 Content parity

- The PDF includes everything the Excel does except live formulas (PDF is static). Derived values are the computed results, formatted per DM section 6.
- Occupancy trend and performance visuals render as vector charts.

## 4. Edge cases

- Missing narrative: export the status and placeholder, do not omit the section.
- Missing images: omit the image frames in PDF (do not print empty dashed slots), note nothing. Excel omits image rows.
- A quarter with no data for the scope: the export buttons are disabled (there is nothing to export).
- Holding export over 50+ properties: generate the roll-up once (reuse the same aggregation used on screen, DM 4.1), do not recompute differently, so screen and export never disagree.

## 5. Acceptance

- Excel opens in Excel and Google Sheets with no `#NAME?` or `#REF!`, recalculates cleanly, and its Total Income, Total OpEx, NOI, and a sampled %Δ match the on-screen figures exactly.
- PDF is selectable text, paginates without orphaned titles, uses the light palette, and matches the on-screen content section for section.
- Neither output contains an em dash anywhere.
