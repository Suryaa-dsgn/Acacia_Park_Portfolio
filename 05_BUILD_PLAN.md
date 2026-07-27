# 05. Build Plan

Phase-gated so Claude Code builds and you verify one slice at a time. Each phase has a goal, a scope, and acceptance criteria. Do not start a phase before its predecessor passes acceptance. Stack: Next.js 14 (App Router), TypeScript, Tailwind, Framer Motion (Motion), per your standard tooling.

Docs to load alongside this: `DESIGN_GUIDELINES.md`, `00_PRODUCT_BRIEF.md`, `01_INFORMATION_ARCHITECTURE.md`, `02_DATA_MODEL.md`, `03_QUARTERLY_REPORT_SPEC.md`, `04_EXPORT_SPEC.md`.

> No em dashes in any code comment, string, label, or doc. Ranges use hyphens.

---

## Phase 0. Foundation: tokens, fonts, theming

**Goal:** the design system is real and switchable before any feature is built.

- Set up the Next.js app, Tailwind, and the token layer (`styles/tokens.css`) with every variable from DG sections 3, 4, 6, 7, for both `dark` and `light`.
- Load the three fonts (Fraunces, IBM Plex Mono, Geist) via `next/font`, wired to `--font-serif`, `--font-mono`, `--font-sans`.
- Map tokens into `tailwind.config` (DG 4.3).
- Build the theme toggle (dark / light / system) with `data-theme`, persistence, `prefers-color-scheme` default, and the eased theme transition (DG 4.2), disabled under reduced motion.
- Build `lib/format.ts` (DM section 6) and `lib/motion.ts` (springs, stagger).

**Acceptance:** a blank page renders in both themes, the toggle works and persists, fonts load, formatters pass unit tests, no em dash appears anywhere.

## Phase 1. Design-system primitives

**Goal:** the reusable component and asset library, in isolation.

- Primitives (DG 8, 9): `Eyebrow`, `Panel`, `KpiCard`, `StatusTag`, `LegendChip`, `Brick`, `BrickBar` (horizontal), `Waffle`, quiet `Button`, inline `Link`, `SegmentedToggle`, `DataTable` with `SortControl`.
- Chart primitives (DG 8): `ScatterPlot`, `TrendChart` (line + area, actual/modeled split, target line prop), `FunnelBars`. Render as SVG (print and export need vector).
- A primitives gallery page (dev-only route) showing every component in both themes with sample props.

**Acceptance:** every primitive renders correctly in both themes in the gallery, matches the guideline (hairlines, tabular numbers, radii, semantic colors), and animates per the motion rules. Reduced-motion path verified.

## Phase 2. Data contract and fixtures

**Goal:** the typed data layer and realistic fixtures, so the UI has real shapes to render.

- Implement the TypeScript types (DM sections 1-4) and the `DataSource` interface (DM section 7).
- Build the fixture data source: `fixtures/<property>/<quarter>.json` for the sample property (Acacia, Q1 2026 from the governed file) plus 3-4 more properties and 2-3 quarters, with occupancy varied across all four semantic bands.
- Implement the holding aggregation (DM 4.1) and generate the holding fixture by running it, not by hand, so the roll-up path is exercised.
- Implement em-dash and whitespace normalization on ingestion (DM section 6).

**Acceptance:** `getReport(scope, quarter)` returns valid, typed reports for every fixture, the holding roll-up sums and weighted-averages correctly (spot-check occupancy and NOI against hand math), and normalization removes all em dashes and non-breaking spaces.

## Phase 3. App shell and navigation

**Goal:** the frame, wired to state and routes, with no report body yet.

- Header (brand lockup, theme toggle), footer (data-source line), layout grid (IA section 3).
- Left navigator: search, All Holdings, property list, selection, keyboard nav, mobile drawer (IA 1.1, 5).
- Top quarter selector: five chips, active indicator with spring, disabled chips for missing data (IA 1.2).
- Routing and view state (IA sections 2, 6): deep links resolve scope and quarter, changing a selector updates the URL and the (still placeholder) main pane.
- Global states scaffolding (IA section 4): loading skeletons, empty, error, not-found.

**Acceptance:** navigating properties and quarters updates the URL and a placeholder main pane, deep links restore selection, the navigator filters on search, everything is keyboard operable, and the shell is responsive across the three breakpoints in both themes.

## Phase 4. Quarterly Report, single property

**Goal:** the hero, fully rendered for one property.

Build the report sections in order (report spec sections 2-11), each independently state-handled:

- 4a. Header + identity, top-line KPI row with YoY.
- 4b. Operating Statement table (PTD + YTD, prior + current + %Δ, favorability coloring).
- 4c. Performance visuals (income/expense/NOI brick bars, opex waffle + legend).
- 4d. Rent Roll Summary, Leasing Activity (tiles + funnel).
- 4e. 12-month occupancy trend.
- 4f. Narrative sections (read-only + status), property images (with empty slots), audit and provenance.

**Acceptance:** for every property fixture and quarter, the report renders completely and correctly, YoY signs and colors follow the favorability rules, all numbers are tabular and correctly formatted, both themes are complete, the load reveal runs once, and a partial report (financials present, narrative unwritten) renders gracefully.

## Phase 5. All Holdings roll-up

**Goal:** the holding variant.

- Wire the holding report (report spec section 13): portfolio identity, rolled-up KPIs and statement, rolled-up rent roll, leasing, occupancy.
- Portfolio Composition block: NOI-by-property brick bars, occupancy scatter, sortable all-properties table with links back to each property report for the same quarter.

**Acceptance:** All Holdings renders a correct roll-up (matches Phase 2 aggregation), the composition visuals are accurate and colored by occupancy band, and clicking a property in the table or a linkable scatter dot navigates to that property's report for the current quarter.

## Phase 6. Export

**Goal:** Excel and PDF export of the current view.

- Excel export (export spec section 2): mirror the governed sheet structure, derived cells as live formulas, headless recalc with zero errors, values verified against screen.
- PDF export (export spec section 3): print stylesheet, light-theme palette, vector charts, page-break rules, running header/footer, shell chrome hidden.
- Export bar wired into the report header (report spec section 12), progress state, disabled when no data.

**Acceptance:** Excel opens cleanly in Excel and Sheets, recalculates with no errors, and its headline figures match the screen. PDF is selectable-text, paginates without orphaned titles, uses the light palette, and matches the on-screen content. Neither contains an em dash. Holding export includes the Properties sheet.

## Phase 7. Polish and hardening

**Goal:** the Apple-level pass.

- Motion review in slow motion: interruptible transitions, on-pointer-down feedback, spring settle, no jank on quarter/scope switches (DG 7).
- Accessibility pass (DG 11, IA 7): contrast verified in both themes with a real checker, focus rings everywhere, tables semantic, charts have accessible alternatives, keyboard complete.
- Empty, partial, error, and not-found states audited across every section.
- Performance: report renders fast on scope/quarter change, charts are vector and cheap, large property lists virtualize if needed.
- Final em-dash sweep across the whole codebase and all rendered output.

**Acceptance:** the product feels calm, fast, and trustworthy in both themes, passes the accessibility checklist, and a full click-through (property to holding, quarter to quarter, export both formats) is clean.

---

## Later phases (mapped, not scheduled here)

- **P8. Portfolio overview page** as a standalone landing (much of it already exists inside the holding report).
- **P9. Compare** (up to five properties side by side).
- **P10. Import / ingestion UI**, once the ingestion model is confirmed (brief section 8, question 1).
- **P11. In-app narrative authoring** (edit market commentary, operations, renovation, with the status workflow).
- **P12. Auth and multi-tenant**, if required.

## Working notes for Claude Code

- One phase per working session. Get it pixel-right in both themes before moving on.
- Never hardcode a hex or a font in a component. Everything flows through the token layer.
- Never hardcode a computed value where a formatter or a formula belongs.
- Keep the `DataSource` seam clean: components read the contract, never a fixture path or an API detail.
- After each phase, do an em-dash grep across source and rendered output. Zero tolerance.
