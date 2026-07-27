# Design Guidelines

Reference product: **Universe Living, Portfolio Reporting**. This document reverse-engineers that reference, then refines it toward a more professional, Apple-level standard and adds a full light mode. Feed this file to Claude Code as the source of truth for building the UI.

> **Hard rule for the whole product: no em dashes anywhere.** Not in UI copy, not in labels, not in generated content, not in this file. Use commas, colons, parentheses, or two sentences instead. See section 11 for the exact replacement patterns.

---

## 0. How to use this file

- Sections 1 to 7 are foundations (principles, type, color, theming, layout, motion). Wire these into your token layer first.
- Section 8 is the asset library: the signature visual motifs (bricks, brick-bars, scatter, ranges, trend charts, legends). This is what makes the product recognizable. Do not skip it.
- Section 9 is component specs with real measurements.
- Sections 10 to 13 are copy voice, accessibility, do/don't, and file structure.
- Every color is a CSS variable. Never hardcode a hex in a component. Every theme decision flows through the token layer so light and dark stay in sync.
- Where a WCAG target is mentioned, verify it in a real contrast checker. Do not trust or invent ratio numbers.

---

## 1. Design north star

The product should read like a **well-set financial broadsheet that happens to be interactive**. Calm, dense, and precise, with the authority of print and the responsiveness of native software.

Five principles, in priority order:

1. **Data has authority, chrome is quiet.** The numbers, bars, and bricks are the interface. Backgrounds, borders, and containers recede. No decorative gradients competing with the data.
2. **Hairlines, not boxes.** Structure comes from thin 1px rules and generous spacing, not heavy cards or drop shadows. In dark mode, almost nothing casts a shadow. Depth is drawn, not lit.
3. **One idea per surface.** Each panel answers one question. When everything is the same weight, contrast is created by letting a single element break the pattern (one pale panel in a dark grid, one green cell in a row of amber).
4. **Semantics are a fixed vocabulary.** Green means healthy, amber means watch, coral means problem, periwinkle means pending. This mapping never changes across the product, so a user learns the color language once.
5. **Motion is physical and interruptible.** Every transition can be grabbed, reversed, and redirected. Nothing locks the user out. Feedback lands on pointer-down, not on release. (See section 7.)

The feeling to protect: **confident calm.** A portfolio manager should feel the tool is telling them the truth plainly.

---

## 2. Typography: the tri-family system

The signature of this design is three families doing three jobs. Keep the roles strict.

| Role | Family | Used for |
| --- | --- | --- |
| **Display serif** | Fraunces (variable, optical sizing) | Page headlines, section titles, the brand wordmark, occasional large editorial numbers |
| **Mono** | IBM Plex Mono | Eyebrows, nav, all-caps labels, table headers, KPI captions, metadata, status tags, footnotes |
| **Sans (data)** | Geist Sans | Body copy, all data values, table cells, form inputs, everything numeric |

### 2.1 Why these

- **Fraunces** carries the same bookish, high-contrast serif character as the reference wordmark, and its optical-size axis lets headlines tighten and body-serif soften correctly (Apple typography discipline, section 2.5). It reads editorial without being generic.
- **IBM Plex Mono** gives the reference's "engineering ledger" label voice: neutral, characterful, legible at 11px uppercase.
- **Geist Sans** is a clean grotesque with excellent tabular figures, which is non-negotiable for a numbers product. It is distinctive enough to avoid the generic Inter/Roboto look while staying a workhorse.

**Premium swaps** (if a license budget exists, drop-in replacements that get closer to the reference): Display -> Tiempos Headline or GT Super. Mono -> Söhne Mono or Berkeley Mono. Sans -> Söhne or ABC Diatype. Keep the same three roles.

### 2.2 Loading (Next.js, next/font)

```ts
// app/fonts.ts
import { Fraunces, IBM_Plex_Mono } from "next/font/google";
import { GeistSans } from "geist/font/sans"; // from the `geist` package

export const serif = Fraunces({
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
  variable: "--font-serif",
  display: "swap",
});

export const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const sans = GeistSans; // exposes --font-geist-sans
```

Map to CSS variables in the layout: `--font-sans: var(--font-geist-sans)`, `--font-serif`, `--font-mono`.

### 2.3 Type scale

Use `clamp()` so the layout scales with text (Apple Dynamic Type discipline). Sizes in rem, spacing in rem so nothing breaks when a user bumps their base font.

| Token | Size (clamp) | Family | Weight | Leading | Tracking |
| --- | --- | --- | --- | --- | --- |
| `display-xl` | 2.5 to 3.5rem | serif | 400 to 500 | 1.05 | -0.02em |
| `display-lg` | 2 to 2.75rem | serif | 400 to 500 | 1.08 | -0.015em |
| `title` | 1.35 to 1.6rem | serif | 500 | 1.15 | -0.01em |
| `kpi-value` | 1.6 to 2rem | sans | 600 | 1.1 | -0.01em |
| `body-lg` | 1.0625 to 1.15rem | sans | 400 | 1.55 | 0 |
| `body` | 0.9375rem | sans | 400 | 1.55 | 0 |
| `data` | 0.9375rem | sans | 500 | 1.3 | 0 |
| `label` | 0.6875 to 0.75rem | mono | 500 | 1.2 | 0.1em, uppercase |
| `eyebrow` | 0.6875rem | mono | 500 | 1.2 | 0.14em, uppercase |
| `caption` | 0.75rem | mono | 400 | 1.4 | 0.04em |

### 2.4 Numerics (mandatory)

- Every number uses `font-variant-numeric: tabular-nums`. Financial tables must not shimmy when values change.
- Currency: `$50,265,590` (thousands separators, no decimals for large money, two decimals only where cents matter).
- Percentages: one decimal, `94.8%`.
- Multipliers: `0.92×` using the multiplication sign `×` (U+00D7), never a lowercase x.
- Deltas: `+3`, `-23.3%`. Sign is always shown for change values, colored with the semantic tokens (positive green, negative coral).

### 2.5 Tracking and leading rules (Apple)

- Tracking is **size-specific**, never one value everywhere. Large serif display gets negative tracking (-0.02em) because letters drift apart as they grow. Body sits at 0. Small mono labels get positive tracking (0.1em to 0.14em) for legibility in all-caps.
- Leading tracks size inversely: tight on headlines (1.05), open on body (1.55), tight on dense data (1.3).
- Build hierarchy from weight + size + leading as a set. Prefer adding weight over adding size when you need emphasis inside dense UI.

---

## 3. Color system

### 3.1 Philosophy

Two layers:

1. **Neutrals** carry the surface. In dark mode they are near-black with a faint green undertone (the "deep ledger" base). In light mode they are warm paper with the same green undertone, so both themes feel like the same product.
2. **The semantic four** are the only saturated colors that carry meaning. Everything else (charts, chips, bars) is built from these plus a small categorical extension.

The semantic four:

| Meaning | Name | Reads as |
| --- | --- | --- |
| Healthy / occupied / positive | **pos** | sage green |
| Watch / caution / mid band | **warn** | amber gold |
| Problem / vacant / negative | **neg** | coral |
| Pending / signed / in-flight | **info** | periwinkle |

### 3.2 Dark mode tokens

```css
:root, [data-theme="dark"] {
  /* neutrals */
  --color-bg:            #0c0e0c;
  --color-surface:       #101310; /* header, footer, sunken panels */
  --color-panel:         #10130f; /* cards and panels, always with a border */
  --color-panel-raised:  #161a14; /* hover, nested, active rows */
  --color-border:        #262b24; /* hairline default */
  --color-border-strong: #363c33; /* dividers that need to read */

  /* text */
  --color-text-serif:    #f2efe3; /* headlines, warm white */
  --color-text:          #ece8db; /* body and data */
  --color-text-muted:    #9a9e91;
  --color-text-faint:    #6d7267;

  /* interactive accent (eyebrows, links, active nav) */
  --color-accent:        #7fc7a6;
  --color-accent-strong: #9ad9bb;

  /* semantic four */
  --color-pos:  #7cbe98;
  --color-warn: #d2a24f;
  --color-neg:  #d68a6b;
  --color-info: #8f97cf;

  /* soft fills for the semantic four (backgrounds, tracks) */
  --color-pos-soft:  rgba(124,190,152,0.14);
  --color-warn-soft: rgba(210,162,79,0.14);
  --color-neg-soft:  rgba(214,138,107,0.14);
  --color-info-soft: rgba(143,151,207,0.14);

  /* the inverted panel: a pale surface that pops out of the dark grid */
  --color-invert-bg:    #dfe8dd;
  --color-invert-ink:   #1b3a2b;
  --color-invert-bar:   #244e39;
  --color-invert-track: rgba(27,58,43,0.14);

  /* elevation: dark mode is drawn with borders, not shadows */
  --shadow-sm: 0 1px 0 rgba(0,0,0,0.35);
  --shadow-md: 0 8px 24px rgba(0,0,0,0.45);
  --shadow-lg: 0 20px 50px rgba(0,0,0,0.55);
}
```

### 3.3 Light mode tokens

Light mode is warm paper with a green undertone (not clinical white), deep green-black ink, and the semantic four darkened and slightly desaturated so they hold contrast on a bright ground. The pale panel from dark mode **inverts to a dark forest panel** so the "one surface pops" moment survives.

```css
[data-theme="light"] {
  /* neutrals */
  --color-bg:            #f4f2ea; /* warm paper */
  --color-surface:       #ebe9df; /* header, footer, sunken panels */
  --color-panel:         #faf9f3; /* cards and panels */
  --color-panel-raised:  #ffffff; /* hover, nested, active rows */
  --color-border:        #e0dbcb;
  --color-border-strong: #cdc7b4;

  /* text */
  --color-text-serif:    #14201a; /* deep green-black */
  --color-text:          #22302a;
  --color-text-muted:    #5f675b;
  --color-text-faint:    #8b9083;

  /* interactive accent */
  --color-accent:        #2f7d5b;
  --color-accent-strong: #226146;

  /* semantic four, darkened for contrast on paper */
  --color-pos:  #2f8a5f;
  --color-warn: #a8791f;
  --color-neg:  #b6553a;
  --color-info: #4750a3;

  /* soft fills */
  --color-pos-soft:  rgba(47,138,95,0.12);
  --color-warn-soft: rgba(168,121,31,0.12);
  --color-neg-soft:  rgba(182,85,58,0.12);
  --color-info-soft: rgba(71,80,163,0.12);

  /* inverted panel: dark forest surface on the light page */
  --color-invert-bg:    #16241b;
  --color-invert-ink:   #eae7da;
  --color-invert-bar:   #7cbe98;
  --color-invert-track: rgba(234,231,218,0.14);

  /* elevation: light mode gets real, soft shadows */
  --shadow-sm: 0 1px 2px rgba(20,32,26,0.06);
  --shadow-md: 0 6px 20px rgba(20,32,26,0.08);
  --shadow-lg: 0 16px 40px rgba(20,32,26,0.10);
}
```

### 3.4 Semantic mapping (the fixed vocabulary)

| Data condition | Token | Example in the reference |
| --- | --- | --- |
| Occupancy at or above 95% | `pos` | green occupancy dots and bricks |
| Occupancy 90 to 95% | `warn` | amber band |
| Occupancy below 90% | `neg` | coral band |
| Unit occupied | `pos` | green brick |
| Unit on notice | `warn` | amber brick |
| Unit vacant | `neg` | coral brick |
| Unit signed applicant | `info` | periwinkle brick |
| Value increase / positive delta | `pos` | `+3`, `$92,938` net income in green |
| Value decrease / loss | `neg` | `-$411,459` in coral |
| "Best in comparison" cell | `pos` | winning column highlighted green |

Fills (`-soft`) are for backgrounds and chart tracks. Solid tokens are for marks, text emphasis, and fills that must read.

### 3.5 Categorical palette (charts with more than four series)

For breakdowns like the operating-expense waffle, extend the semantic four with three harmonized hues. Order matters (assign in sequence). Light-mode variants darken the same hues.

```css
:root {
  --cat-1: var(--color-pos);   /* green */
  --cat-2: var(--color-info);  /* periwinkle */
  --cat-3: #b58fc9;            /* mauve */
  --cat-4: var(--color-warn);  /* amber */
  --cat-5: var(--color-neg);   /* coral */
  --cat-6: #6fb0c4;            /* teal-blue */
  --cat-7: #c9c07a;            /* olive */
}
[data-theme="light"] {
  --cat-3: #8e63a6;
  --cat-6: #3f7f95;
  --cat-7: #8a8340;
}
```

### 3.6 Contrast rules

- Target WCAG AA: 4.5:1 for body text, 3:1 for large text and UI marks. Verify in a checker before shipping any token change.
- In light mode, the solid semantic tokens are tuned for **marks and emphasis**. For small body-size colored text (for example a colored table value), prefer the darker `-strong` accent or the deep ink, and reserve the brighter semantic hue for the swatch or bar next to it.
- Never rely on color alone. Pair every colored state with a label, a position, or a shape (see legend chips, section 8.7).

---

## 4. Theming implementation

### 4.1 Switching

- Set `data-theme` on `<html>`. Default from `prefers-color-scheme`, then let a manual toggle override and persist (localStorage in the app, not in artifacts).
- Provide a third option, `system`, that clears the override.

```ts
function applyTheme(mode: "light" | "dark" | "system") {
  const root = document.documentElement;
  if (mode === "system") {
    root.removeAttribute("data-theme");
    root.dataset.theme = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } else {
    root.dataset.theme = mode;
  }
}
```

### 4.2 Ease the theme change (Apple)

A hard cut between dark and light is a jarring brightness jump. Cross-fade the surface and text colors, and disable the transition under reduced motion.

```css
:root { --theme-transition: background-color 240ms ease, color 240ms ease, border-color 240ms ease; }
html, body, .panel, .card, .kpi { transition: var(--theme-transition); }

@media (prefers-reduced-motion: reduce) {
  :root { --theme-transition: none; }
}
```

### 4.3 Tailwind mapping

Map every token so components use `bg-panel`, `text-muted`, `border-hairline`, etc. Never reach past the token layer.

```js
// tailwind.config.js -> theme.extend
colors: {
  bg: "var(--color-bg)",
  surface: "var(--color-surface)",
  panel: "var(--color-panel)",
  "panel-raised": "var(--color-panel-raised)",
  hairline: "var(--color-border)",
  "hairline-strong": "var(--color-border-strong)",
  "text-serif": "var(--color-text-serif)",
  ink: "var(--color-text)",
  muted: "var(--color-text-muted)",
  faint: "var(--color-text-faint)",
  accent: "var(--color-accent)",
  "accent-strong": "var(--color-accent-strong)",
  pos: "var(--color-pos)",
  warn: "var(--color-warn)",
  neg: "var(--color-neg)",
  info: "var(--color-info)",
},
fontFamily: {
  serif: ["var(--font-serif)", "Georgia", "serif"],
  mono: ["var(--font-mono)", "monospace"],
  sans: ["var(--font-sans)", "system-ui", "sans-serif"],
},
borderRadius: { xs: "2px", sm: "4px", md: "6px", pill: "999px" },
```

---

## 5. Spacing, grid, layout

- **Base unit 4px**, primary rhythm 8px. Scale: 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96.
- **Container**: max-width 1360px, centered. Side padding `clamp(16px, 4vw, 48px)`. Page top padding 64 to 96px so headlines breathe.
- **Section rhythm**: 48 to 72px between major sections.
- **Dashboard grids**:
  - KPI row: 4 equal columns on desktop, 2 on tablet, 1 on mobile. Divided by hairlines or gaps of 12 to 16px.
  - Two-panel split: `grid-template-columns: 1fr 1fr` with a 20 to 24px gap. Collapses to one column under about 900px.
  - Full-width tables and trend blocks span the container.
- **Alignment**: numbers right-aligned in tables, labels left-aligned, so a column of money forms a clean edge. Everything sits on the 4px grid. Misalignment reads as carelessness (Apple: craft).

---

## 6. Radii, borders, elevation

- **Radii**: crisp and editorial. `xs 2px` (bricks, chips, swatches), `sm 4px` (cards, inputs, buttons), `md 6px` (large panels), `pill 999px` (toggles, slider thumbs, probability tracks). Do not round more than this. The character is precise, not soft.
- **Borders**: 1px `--color-border` is the default structural line. Use `--color-border-strong` only where a divider must read (table header underline, active tab). Borders do most of the structural work, especially in dark mode.
- **Elevation**:
  - Dark mode: near flat. Structure from borders. Reserve `--shadow-md` for genuinely floating things (menus, popovers, dragged items).
  - Light mode: soft shadows on cards and panels (`--shadow-sm` at rest, `--shadow-md` on hover or float). Keep them low and diffuse, never hard.
- **The inverted panel** is the one intentional pop: a pale panel in dark mode, a forest panel in light mode. Use it for at most one element per screen (for example a probability signal card). Overusing it kills the effect.

---

## 7. Motion system (Apple-level)

Motion is designed with the visuals, not added after. The bar: an interface that feels like a physical object you can grab.

### 7.1 Principles

1. **Respond on pointer-down, feedback is continuous.** A pressed element reacts instantly, not on release. Drags, sliders, and the occupancy-shock control update 1:1 with the pointer the whole way through.
2. **Everything is interruptible.** No animation locks out input. A user can grab a moving element mid-flight and reverse it. Animate from the current on-screen value, never from the target, so interrupts do not jump.
3. **Springs over fixed durations** for anything the user can touch. New input changes the target, motion stays continuous.
4. **Bounce is earned.** Default to critically damped (no overshoot). Add a little bounce only when a gesture carried momentum (a flick, a drag release). A menu that just faded in should not bounce.

### 7.2 Motion tokens

```css
:root {
  /* CSS transitions for non-gesture, presentational motion */
  --ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-out:      cubic-bezier(0.16, 1, 0.3, 1);
  --dur-fast:  120ms;
  --dur-base:  220ms;
  --dur-slow:  360ms;
}
```

Spring config for Motion / Framer Motion (React):

```ts
export const springUI       = { type: "spring", bounce: 0,   duration: 0.35 }; // default
export const springMomentum = { type: "spring", bounce: 0.2, duration: 0.4  }; // flick, drag release
```

### 7.3 Patterns

- **Press feedback**: `transform: scale(0.985)` with `transition: transform 100ms ease-out` on `:active`. Instant, subtle.
- **Row and card hover**: background to `--color-panel-raised` over `--dur-fast`. Nothing moves position.
- **Page load**: one orchestrated reveal. Stagger the KPI row and panels in with a short fade plus 6 to 10px rise, `springUI`, ~40ms stagger. Do this once per page, not on every scroll. Restraint reads as quality.
- **Number changes**: animate value roll-ups with a spring on the numeric value, keep `tabular-nums` so width never jumps. Color the delta with the semantic token.
- **Sliders and shocks**: the thumb tracks the pointer 1:1. On release, if the interaction had velocity, settle with `springMomentum`, otherwise `springUI`.
- **Bricks and bars appearing**: fade and scale from 0.9 with a tiny per-cell stagger (cap total stagger so a 226-unit grid does not take seconds). For large grids, animate opacity only.

### 7.4 Reduced motion and accessibility

- `prefers-reduced-motion: reduce`: replace slides, springs, and staggers with short opacity cross-fades. Drop overshoot. Keep color and opacity changes that aid comprehension. Disable the theme cross-fade.
- `prefers-reduced-transparency: reduce`: make any translucent chrome solid, raise opacity, drop blur.
- `prefers-contrast: more`: near-solid backgrounds with a defined contrasting border.
- Never trap the user mid-animation. Every transition is skippable and reversible.

---

## 8. Asset library (the signature visual language)

These motifs are what make the product recognizable. Build them as reusable primitives.

### 8.1 The brick (the core motif)

One small square equals one countable thing: a unit, or a quantum of value. This is the identity of the whole product.

- **Cell size**: 12 to 16px in compact contexts (brick bars), 16 to 20px in the unit grid.
- **Gap**: 3px.
- **Radius**: 2px (`xs`).
- **States** (fill with the semantic token, no border needed):
  - occupied -> `pos`
  - on notice -> `warn`
  - vacant -> `neg`
  - signed applicant -> `info`
  - empty track (unfilled remainder) -> a faint fill at `--color-border` or `--color-*-soft`
- **Interaction**: hover raises the cell slightly (`scale(1.08)`) and shows a tooltip with the unit id and status. Click opens detail. Feedback on pointer-down.

### 8.2 Horizontal brick bar (NOI by property)

A waffle-style bar where each square is a quantum of value, filled left to right, with the unfilled remainder shown as a faint track.

- Row height matches cell size (12 to 16px). Squares fill according to value against the row max.
- **Color the whole row by its occupancy band** (`pos`, `warn`, or `neg`), so a scan of the list reads health and magnitude at once.
- Label left (property name, sans, truncate with ellipsis), value right (sans, tabular, right-aligned).
- Sort control lives above the list (mono pill buttons: Sort NOI, Sort Occupancy, Sort Name).

### 8.3 Scatter plot (occupancy vs NOI per unit)

- Dots colored by occupancy band (the semantic three: `pos`, `warn`, `neg`).
- Axes labeled in mono, muted, with a few gridlines at `--color-border`.
- Dot radius ~4px, hover grows to ~6px and shows a tooltip. Clickable dots that link to a report get a subtle ring on hover, non-linkable dots do not (honest affordance).
- Axis labels use the mono `caption` style, uppercase where short (`NOI / UNIT`, `LTM OCCUPANCY`).

### 8.4 Range / distribution row (predictive occupancy)

A horizontal track per property showing a modeled range with a marker.

- Track: full-width thin bar at `--color-border`.
- Range band: a lighter segment (`--color-*-soft`) showing the modeled spread.
- Marker: a filled dot at the expected value.
- **Target line**: a vertical dashed line across all rows in `--color-warn` or `--color-neg`, labeled at the top (for example `95.5% target`). Dashed, thin, honest about being a threshold.
- Below the rows: three scenario cards (Downside, Expected, Upside) tinted `neg-soft`, `pos-soft` neutral, and `pos-soft`, each with a percentage and a modeled dollar figure.

### 8.5 Probability bars and ring

- **Bars**: label left, percentage right, a thin fill bar beneath in `--color-accent` or the deep invert bar color when inside the inverted panel. Track at `--color-invert-track` or `--color-border`.
- **Ring**: a small donut showing a single probability, thick stroke, `--color-accent` on a faint track, the number set large in serif at the center-right. Used sparingly, one per panel.

### 8.6 Line and area trend (occupancy over time, actual then modeled)

- Solid line for **actual** history, dashed line for **modeled** future, split at a vertical "today" marker.
- Soft area fill under the modeled section only (`--color-pos-soft`), signaling it is a projection not a fact.
- Dashed horizontal **target line** in `--color-warn`, labeled inline (`95.5% target`).
- Data points as small filled dots on the actual line. Annotate the latest actual point (for example `May: 98.0% actual`).
- Axis in mono caption, muted.

### 8.7 Legend chips

- A small filled square (10 to 12px, radius 2px) in the series color, followed by the label in mono or small sans.
- Squares match brick radius so the whole system feels cut from the same material.
- Always present when more than one semantic color appears in a view. This is also the color-blind safeguard: color plus text label, never color alone.

### 8.8 Eyebrow label

- Mono, uppercase, `eyebrow` token, color `--color-accent`. Sits above every page headline (`PORTFOLIO`, `SIGNAL`, `COMPARE`, `IMPORT`). This teal-over-serif pairing is a core rhythm of the brand.

### 8.9 Status tags

- Small mono uppercase pills. `SUMMARY ONLY` and `COMPARE ONLY` in `--color-faint` (non-actionable). `VIEW REPORT →` in `--color-accent` (actionable, with a trailing arrow). `NEEDS AUTHORING` in `--color-warn-soft` background with `warn` text. `RESILIENT` and other health tags in `--color-pos-soft` with `pos` text.

### 8.10 Iconography

The reference is almost icon-free, and that restraint is correct. Prefer text and arrows over icons.

- Allowed by default: disclosure triangle (`▶` collapsed, `▼` expanded), right arrow (`→`) for navigation and links, the multiplication sign for ratios.
- If icons are genuinely needed, use a single thin line set (Lucide or Phosphor), 1.5px stroke, 16 to 18px, colored `--color-muted`. Never mix icon sets. Never use filled or duotone icons here.

---

## 9. Component specs

### 9.1 App shell

- **Header**: full-width bar, `--color-surface` background, 1px bottom hairline. Left: brand lockup. Right: nav.
- **Brand lockup**: serif wordmark (`title` weight 500) plus a mono descriptor beside it in `--color-muted` (`PORTFOLIO REPORTING`). This serif-plus-mono pattern is the logo. Reuse it for your product's name.
- **Nav**: mono, uppercase, `label` token, letter-spacing 0.1em. Inactive `--color-muted`, active `--color-text-serif` (or `--color-accent`). Hover brightens over `--dur-fast`. Generous spacing between items.
- **Footer**: `--color-surface`, 1px top hairline, mono caption in `--color-faint` (for example the data-source line). Note: the reference footer uses a middot separator (`·`), which is fine. It must not use an em dash.

### 9.2 KPI / metric card

- Padding 20 to 24px. 1px border, radius `sm`. Background `--color-panel`.
- **Caption**: mono uppercase `label`, `--color-muted`, letter-spacing 0.1em (`PORTFOLIO LTM NOI`).
- **Value**: sans, weight 600, `kpi-value` token, tabular, `--color-text-serif`.
- Optional **sub-caption** below in mono `caption`, `--color-faint` (`293 of 304 units`, `43.8% margin`). Color the sub-caption semantically when it carries health.
- In a KPI row, either give each card its own border or separate them with hairline dividers, not both.

### 9.3 Panel / card

- Background `--color-panel`, 1px border, radius `md`, padding 24 to 28px.
- **Header block**: serif `title` plus a one-line sans `body` description in `--color-muted`. Optional right-aligned control (a `SHOW ALL 52` mono link, a segmented toggle).
- Light mode adds `--shadow-sm` at rest.

### 9.4 Data table

- **Header row**: mono uppercase `label`, `--color-muted`, 1px `--color-border-strong` bottom border. Numeric headers right-aligned.
- **Body rows**: 1px `--color-border` bottom border, vertical padding 12 to 16px. No zebra striping, hairlines only.
- **Cells**: property name sans `data` weight 500, location sans `body` `--color-muted`, numbers sans tabular right-aligned. Percentages and money share the tabular column edge.
- **Status cell**: mono, right-aligned. `VIEW REPORT →` in `--color-accent`, `SUMMARY ONLY` / `COMPARE ONLY` in `--color-faint`.
- **Hover**: row background to `--color-panel-raised`, `--dur-fast`. Cursor pointer only on rows that link.
- **Sort**: segmented mono pill control above the table, active segment `--color-pos-soft` background with `pos` or ink text.
- **Empty numeric**: a single en-of-line dash character is used in the reference (`-`). Use a plain hyphen or an explicit "n/a", never an em dash.

### 9.5 Tabs

- Mono `label`, sentence or title case, spaced. Active tab: `--color-text-serif` text with a 2px `--color-accent` underline. Inactive `--color-muted`. Underline slides between tabs with `springUI` (interruptible).

### 9.6 Import dropzone

- Dashed 1px border in `--color-border-strong`, radius `sm`, min-height ~180px, centered content.
- Primary line: mono uppercase (`DROP .XLSX FILES HERE, OR CLICK TO BROWSE`). Secondary line: sans `body` `--color-muted`.
- **Drag-active state**: border to `--color-accent`, background to `--color-accent-soft` (define as `--color-pos-soft` reuse or a dedicated accent-soft), instant on dragenter.
- Copy must reassure without hype: "Each file is parsed and checked before anything is written. Nothing is committed until you review the preview and confirm." (No em dash, note the period where the reference used one.)

### 9.7 Narrative / empty states

- For unwritten sections: a bordered block, serif `title` for the section name, a `NEEDS AUTHORING` tag top-right, and italic sans `--color-muted` placeholder ("Not yet written, click to author this section"). The block is clearly a call to action, not an error.

### 9.8 Buttons and links

The product is link-and-table driven, so buttons are quiet.

- **Quiet button** (default, for example `REPORT BUILDER →`): 1px border, mono uppercase `label`, padding 8px 14px, radius `sm`. Hover: border to `--color-border-strong`, text to `--color-text-serif`. Press: `scale(0.985)`.
- **Inline link**: `--color-accent`, underline on hover, trailing `→` for navigation.
- **Segmented toggle** (3M / 6M / 12M, noi / occupancy / name): mono, pill container, active segment filled `--color-accent-soft` or `--color-pos-soft`, spring-slide the active indicator.
- Reserve any solid high-contrast button for a single primary action per screen, if at all.

---

## 10. Copy and voice

- **Tone**: editorial, precise, understated. State the fact, then stop. No hype, no "excited to announce", no exclamation marks in product copy.
- **Case**: sentence case for prose and headlines (serif headlines can be title-feeling but stay sentence case, matching the reference "Every property, one quarter at a glance"). UPPERCASE only for mono labels, eyebrows, nav, and tags.
- **Headlines** can have a little editorial character ("Your assets, read as a skyline."). Keep them short and confident.
- **Descriptions** are one plain sentence that says what the panel shows and how to use it.
- **Honesty in labels**: if a chart is a model, say "illustrative model, not a statistical forecast". If data is missing, show it as missing. Never imply precision the data does not have. (This also matches the standing rule: flag assumptions and modeled numbers, never present them as measured facts.)

### 10.1 Number formatting (repeat, because it matters)

- Money: `$1,769,661`. Negative money: `-$411,459` in `neg`.
- Percent: one decimal, `95.5%`.
- Ratio / multiplier: `0.92×` with `×`.
- Delta: signed, `+5`, `-23.3%`, colored semantically.
- All numeric text `tabular-nums`.

### 10.2 Removing em dashes (required)

The reference uses em dashes in several places. Remove all of them. Replacement patterns:

| Reference usage (em dash) | Replacement |
| --- | --- |
| "nothing is written — nothing is committed" | comma or period: "nothing is written. Nothing is committed" |
| "Economic Occupancy — actual + market rent" (label caption) | colon: "Economic Occupancy: actual plus market rent" |
| "Latest — Jun: 92.8%" | colon or comma: "Latest, Jun: 92.8%" |
| "Full chart of accounts — 607 line items" | comma: "Full chart of accounts, 607 line items" |
| "First 8 units — open the full explorer" | period or comma: "First 8 units. Open the full explorer" |
| Range like "90 to 95%" | hyphen or the word "to": "90-95%" or "90 to 95%" |

Rule of thumb: an em dash is almost always replaceable by a comma, a colon, a period, or parentheses. Pick the one that fits the pause. Do not substitute an en dash either. Keep the middot (`·`) separators, they are fine.

---

## 11. Accessibility checklist

- Color is never the only signal. Every semantic color is paired with a label, a legend chip, or a position.
- Verify contrast for text and UI marks in both themes with a real checker (AA: 4.5:1 body, 3:1 large and UI). Do not assume the tokens pass, confirm them.
- Focus states: a visible 2px `--color-accent` ring on every interactive element, offset 2px. Never remove focus outlines.
- Hit targets at least 44x44px for touch, even where the visual mark (a brick) is smaller. Expand the interactive area with padding.
- Respect `prefers-reduced-motion`, `prefers-reduced-transparency`, `prefers-contrast` (section 7.4).
- Tables use real `<table>` semantics with `<th scope>`. Charts have text alternatives or an accessible data table behind them.
- Keyboard: every row, tab, toggle, and dropzone is reachable and operable by keyboard. The dropzone accepts a keyboard-triggered file browse.

---

## 12. Do and Don't

**Do**
- Let the data be the brightest thing on the screen.
- Use hairlines and space for structure.
- Keep the three type roles strict (serif headline, mono label, sans data).
- Use the semantic four consistently, everywhere, forever.
- Make one element per screen break the pattern (the inverted panel).
- Make every animation interruptible and every press instant.
- Format all numbers tabular, signed deltas colored semantically.

**Don't**
- No em dashes. Anywhere.
- No drop shadows in dark mode for resting surfaces (borders only).
- No purple-on-white gradient, no generic SaaS card grid, no Inter or Roboto.
- No color without a label.
- No fabricated metrics or fake precision in any placeholder or demo data. Mark modeled and sample data as such.
- No bouncy overshoot on things that were not flicked or dragged.
- No icons where an arrow or a word does the job.

---

## 13. Suggested file structure

```
/styles
  tokens.css        # :root, [data-theme="light"], all variables from sections 3, 4, 6, 7
  base.css          # element resets, body font, tabular-nums default on numeric utility
/lib
  motion.ts         # springUI, springMomentum, stagger helpers
  format.ts         # money(), percent(), ratio(), delta() formatters (enforce no em dash)
  theme.ts          # applyTheme(), persistence
/components
  /primitives       # Brick, BrickBar, LegendChip, Eyebrow, StatusTag, KpiCard, Panel
  /charts           # Scatter, RangeRow, ProbabilityBar, TrendChart, Waffle
  /shell            # Header, Nav, Footer, ThemeToggle
  /table            # DataTable, SortControl
/app                # routes: portfolio, signal, compare, import, property/[id]
```

Build order (phase-gated): tokens and fonts first, then primitives, then charts, then the table, then assemble each route. Get one route pixel-right in both themes before moving to the next.

---

*This guideline describes the target system. When a real product name, exact fonts, or data model are confirmed, update sections 2.1 (fonts), 3.4 (semantic mapping), and the brand lockup in 9.1 accordingly.*
