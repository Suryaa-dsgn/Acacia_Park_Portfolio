# 01. Information Architecture

Navigation, routing, the app shell, and global states. Styling comes entirely from `DESIGN_GUIDELINES.md`. This doc defines structure and behavior.

> No em dashes. Ranges use a hyphen (`Q1'25 - Q1'26`). Pauses use commas, colons, or parentheses.

---

## 1. Navigation model

Two persistent selectors frame every report view, adopted from the preferred reference ("The Ledger" screenshot) and restyled with our tokens.

- **Left navigator (vertical):** search, an All Holdings entry, and the full property list. Selects **which** report.
- **Top quarter selector (horizontal):** five quarters. Selects **when**.

The main pane always shows the Quarterly Report for the current (scope, quarter) pair. Changing either selector re-renders the main pane without a full navigation.

### 1.1 Left navigator

Structure, top to bottom:

1. **Brand lockup** (also in the header on wide screens; on the navigator it can be the collapse control). Serif wordmark plus mono descriptor per design guideline 9.1.
2. **Search field.** Placeholder `Search properties`. Filters the list live by property name and city. Mono label optional, sans input text.
3. **All Holdings** entry. Icon (grid or building-cluster, Lucide, 16px, muted), primary label `All Holdings`, secondary `Portfolio roll-up`. Selecting it sets scope to the roll-up. Visually separated from the property list by a hairline.
4. **Section label:** mono `PROPERTIES (52)` with the live count.
5. **Property list.** Each row: a single thin building icon (Lucide `building-2`, 16px, muted), primary line = trade name (sans, weight 500), secondary line = city, state (sans, muted). Selected row uses `--color-panel-raised` background with a 2px `--color-accent` left border. Hover uses `--color-panel-raised`. Rows are keyboard navigable (up/down/enter).

Behavior:
- The navigator is a scrollable column with the search and All Holdings pinned at top (sticky), the property list scrolling beneath.
- Selecting a property keeps the current quarter selection.
- On narrow screens the navigator collapses into a drawer opened by a menu control (see responsive, section 5).
- Empty search result: a quiet mono line, `No properties match "<query>"`.

### 1.2 Top quarter selector

- Five quarter chips, oldest to newest, left to right, for example `Q1'25  Q2'25  Q3'25  Q4'25  Q1'26`.
- Active chip is filled (in dark mode: `--color-panel-raised` with `--color-text-serif` text and an accent underline or a solid inverted fill; in light mode the reference used a dark filled chip, we use `--color-invert-bg` fill with `--color-invert-ink` text for the active chip so it reads as the one selected). Inactive chips are quiet outlined or borderless mono labels.
- The active indicator slides between chips with `springUI` (interruptible, per motion system).
- Only five are ever shown (client keeps five quarters). If fewer exist, show only what exists, left-aligned, and do not pad with empty chips.
- Changing the quarter keeps the current scope (property or All Holdings).
- A quarter with no governed data for the current scope is disabled (muted, not clickable) with a tooltip, `No governed report for this quarter`.

## 2. Routes

Use path-based routing so any (scope, quarter) is linkable and shareable.

```
/                                  -> redirect to latest quarter, All Holdings
/holdings/:quarter                 -> All Holdings roll-up report
/property/:propertyId/:quarter     -> single property report
```

- `:quarter` slug format: `2026-q1` (lowercase, hyphen). Human label derived in the UI (`Q1'26`).
- `:propertyId`: the governed property id (stable code, for example `acacia`).
- Deep links resolve the navigator selection and the quarter chip on load.
- Invalid `:propertyId` or `:quarter` shows the not-found state (section 4) inside the shell, navigator intact.

Later routes (mapped, not Phase 1): `/portfolio`, `/compare`, `/import`.

## 3. App shell layout

```
┌───────────────────────────────────────────────────────────────┐
│ Header: brand lockup            theme toggle   (nav links later) │
├───────────┬───────────────────────────────────────────────────┤
│           │  Top quarter selector                              │
│  Left     ├───────────────────────────────────────────────────┤
│ navigator │                                                    │
│ (property │  Main pane: Quarterly Report                       │
│  list)    │  (scrolls independently)                           │
│           │                                                    │
├───────────┴───────────────────────────────────────────────────┤
│ Footer: data source line                                        │
└───────────────────────────────────────────────────────────────┘
```

- **Header:** full width, `--color-surface`, 1px bottom hairline. Left: brand lockup. Right: theme toggle (dark / light / system). Space reserved on the right for future top-level nav (Portfolio, Compare, Import) but not shown in Phase 1.
- **Left navigator:** fixed width around 300-320px on desktop, its own scroll, 1px right hairline.
- **Top quarter selector:** sits above the main pane only (not above the navigator), sticky to the top of the main pane on scroll, with a `--color-bg` backdrop and 1px bottom hairline.
- **Main pane:** the report, max content width from the guideline container, its own vertical scroll.
- **Footer:** full width, mono caption, the governed data-source line (see below).

Footer copy example (no em dash), `Governed from Yardi Voyager quarterly exports · Cash basis · 5 quarters retained`.

## 4. Global states

Every data-bound region handles four states. Never show a raw spinner alone.

1. **Loading.** Skeletons that match the final layout (KPI card blocks, table rows, chart frames) using `--color-panel` fills with a subtle shimmer. Respect reduced motion (static skeletons, no shimmer).
2. **Empty / not yet available.** For a valid scope and quarter with no data, a quiet centered block: mono eyebrow, serif line (`No governed report for Q1'26 yet`), one sans sentence explaining that the quarter has not been imported. Reuse the reference product's calm empty-state voice.
3. **Partial.** Financials present, narrative not yet authored. Financial sections render fully. Narrative sections show the authoring status tag and placeholder (design guideline 9.7). This is the common launch state.
4. **Error.** A bordered block, mono `COULD NOT LOAD`, one plain sentence, and a Retry quiet button. No stack traces. Errors never take over the whole shell, only the affected pane.

Not-found (bad route): the shell stays, the main pane shows a centered `That report does not exist` with a link back to the latest All Holdings report.

## 5. Responsive behavior

- **Wide (>= 1100px):** navigator, quarter selector, and main pane as drawn above.
- **Medium (700-1099px):** navigator collapses to an off-canvas drawer, opened by a menu control in the header. Quarter selector may scroll horizontally if cramped. Main pane goes full width.
- **Narrow (< 700px):** single column. Header holds the menu control and a compact scope label showing the current property. Quarter selector becomes a horizontally scrollable strip or a compact dropdown. Report sections stack; two-panel splits become one column; tables gain horizontal scroll with the first column pinned.
- Everything uses `rem` spacing so a larger base font does not break layout (Apple Dynamic Type discipline).

## 6. Scope and quarter state

Hold two pieces of global UI state, both reflected in the URL:

```ts
type Scope =
  | { kind: "holding" }
  | { kind: "property"; propertyId: string };

type QuarterId = string; // "2026-q1"

interface ViewState {
  scope: Scope;
  quarter: QuarterId;
}
```

- Default on first load: latest available quarter, `holding` scope.
- Changing scope preserves quarter if that quarter exists for the new scope, otherwise falls back to the nearest available quarter for that scope and shows a one-line notice.
- Both selectors read from and write to this state. The main pane is a pure function of it.

## 7. Keyboard and accessibility

- Property list: arrow keys move, Enter selects, type-ahead jumps to a matching name.
- Quarter selector: left/right arrows move between chips, Enter selects, disabled chips are skipped.
- Visible focus ring (2px accent, 2px offset) on every interactive element.
- Landmarks: `header`, `nav` (navigator), `main` (report), `footer`. The quarter selector is a `tablist` with `tab` chips controlling the report `tabpanel`.
- Skip-to-report link as the first focusable element.
