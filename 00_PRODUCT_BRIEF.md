# 00. Product Brief

Companion docs: `DESIGN_GUIDELINES.md` (visual system), `01_INFORMATION_ARCHITECTURE.md`, `02_DATA_MODEL.md`, `03_QUARTERLY_REPORT_SPEC.md`, `04_EXPORT_SPEC.md`, `05_BUILD_PLAN.md`.

> No em dashes anywhere in this product or these docs. Use commas, colons, parentheses, or two sentences.

---

## 1. What we are building

A **quarterly reporting portal** for a real-estate firm that owns 50+ multifamily properties across the United States. The portal presents a clean, governed **Quarterly Operating Report** for any property, for any of the last five quarters, and can roll every property up into a single **All Holdings** report. It also exports that report to Excel and PDF.

The visual system is the one defined in `DESIGN_GUIDELINES.md`: an editorial financial-broadsheet aesthetic, dark and light modes, the tri-family type system, the four-color semantic language, and the brick motif.

## 2. Who uses it

- **Asset managers and ownership** at the real-estate firm. They want a fast, trustworthy read of how a property performed this quarter versus the same quarter last year, and a portfolio-level roll-up.
- **The reporting team / product partner** who governs the data and authors the narrative sections.

The tone to protect (from the design north star): confident calm. These are people making money decisions. The tool must feel like it is telling the truth plainly.

## 3. The data reality (important context)

Two source shapes exist, both seen in the sample files:

1. **Raw client export** (`Acacia_-_2025_Q4__2_.xlsx`): a packed Yardi Voyager dump. Multiple report fragments at different column offsets, GL account codes (`4300-0000 Rental`), messy headers, non-breaking spaces. Not fit for direct display.
2. **Governed / scrubbed report** (`Acacia_Q1_2026_Quarterly_Narrative_SCRUBBED.xlsx`): the clean output the product partner produces from the raw export. Fixed section order, labeled line items, prior-year comparatives, live YoY formulas, and an audit and provenance trail.

**The scrubbed structure is the data contract for this portal.** The portal renders governed data. See section 8 (assumptions) for how the governed data reaches the portal, which is the one architectural question to confirm.

## 4. Scope

### In scope (this engagement, phased)

- App shell: left property navigator, top five-quarter selector, header, footer, theme toggle (dark and light).
- The **Quarterly Operating Report**, per property, for a selected quarter.
- **All Holdings** roll-up variant of that report.
- **Prior-year same-quarter comparison** (YoY) built into the report.
- **Export** to Excel and PDF.
- Loading, empty, and error states throughout.

### Adjacent, mapped but later (not Phase 1)

- Portfolio landing / overview page (the roll-up dashboard from the reference product: NOI-by-property brick bars, occupancy scatter, sortable all-properties table).
- Compare view (up to five properties side by side).
- Import / ingestion UI.
- In-app narrative authoring (editing market commentary, operations, renovation sections). Phase 1 displays authored narrative and its status, read-only.
- Property image management.

### Out of scope (for now, flag if needed)

- Authentication, roles, multi-tenant. Design assumes a single trusted tenant until told otherwise.
- The raw-to-governed data pipeline itself (that is the partner's MAGNUS pipeline). The portal consumes its output.
- Retaining more than five quarters of history (client decision: only five are kept).

## 5. Full product map

```
Reporting Portal
├── App shell
│   ├── Left navigator: search, All Holdings, property list (50+)
│   ├── Top quarter selector: 5 quarters (e.g. Q1'25 ... Q1'26)
│   ├── Header: brand lockup, theme toggle
│   └── Footer: data source line
│
├── Quarterly Report  [PRIMARY, Phase 1]
│   ├── Property scope: single property  OR  All Holdings roll-up
│   ├── Report header + property identity
│   ├── Top-line KPIs (Total Income, Total OpEx, NOI, Occupancy) with YoY
│   ├── Operating Statement (PTD + YTD, current vs prior year, %Δ)
│   ├── Performance visuals (income/expense/NOI, opex breakdown)
│   ├── Rent Roll Summary
│   ├── Leasing Activity
│   ├── 12-month occupancy trend (current + prior year)
│   ├── Narrative sections (read-only display + status)
│   ├── Property images
│   ├── Audit & provenance
│   └── Export: Excel, PDF
│
├── Portfolio overview  [later]
├── Compare  [later]
├── Import  [later]
└── Narrative authoring  [later]
```

The Quarterly Report is the hero. Everything in Phase 1 serves getting one property's report, and the All Holdings report, pixel-right in both themes with working export.

## 6. Success criteria for Phase 1

- A user can pick any property and any of five quarters and read a complete, correct Quarterly Operating Report.
- The user can switch to All Holdings and see a correct roll-up.
- Every financial figure shows the prior-year comparable and a correctly signed, correctly colored YoY change.
- The report exports to Excel (with live formulas for derived cells) and to PDF (print-faithful).
- Both themes are complete. No em dashes anywhere.
- The report renders from a typed data contract (section see `02_DATA_MODEL.md`), so the data source can change without touching the UI.

## 7. Glossary

| Term | Meaning |
| --- | --- |
| PTD | Period-to-date (this quarter) |
| YTD | Year-to-date |
| YoY | Year over year, this quarter versus the same quarter last year |
| %Δ | Percent change, `(current - prior) / prior` |
| NOI | Net Operating Income = Total Income - Total Operating Expenses |
| Physical Occupancy | Occupied units / total units |
| Economic Occupancy | In-place rent / total market rent |
| Holding / All Holdings | The whole portfolio rolled into one report |
| Governed data | Cleaned, audited data from the partner pipeline, the portal's input |
| Rent roll | Unit-level rent and occupancy snapshot as of a date |

## 8. Assumptions and open questions

These are the calls I made so the plan is buildable. Confirm or correct.

1. **Ingestion model (the one big fork).** I assume the portal consumes **governed data** (the scrubbed shape), one dataset per property per quarter, delivered as typed JSON via an API or a loaded governed file. The raw-to-governed parsing stays in the partner pipeline. Phase 1 uses fixture JSON derived from the sample files. If instead the portal itself must parse raw Yardi exports, that is a separate parsing module and a much larger effort, and `02_DATA_MODEL.md` gains an ingestion-adapter section. **Confirm which.**
2. **Backend and persistence.** The frontend is built backend-agnostic against the data contract. I assume a simple data source (static governed JSON per property-quarter, or a thin read API). No database work is specified here. Confirm if there is an existing backend or API shape to target.
3. **Narrative authoring.** Phase 1 displays authored narrative sections and their status (Completed, Work in Progress, Gathering Info, Not Started), read-only. In-app editing is a later phase. Confirm that read-only is acceptable for launch.
4. **Holding-level averages.** Roll-up sums additive figures and computes weighted averages for occupancy and rents (rules in `02_DATA_MODEL.md`). A few average-rent definitions in the governed file are ambiguous. I flag each and use a stated weighting, to be confirmed against the partner's governed definitions.
5. **Property images.** The report has image slots (property photo, aerial/site map). Phase 1 renders slots with graceful empty states. Sourcing and upload is later.
6. **Auth.** Assumed single trusted tenant, no login, for now.
