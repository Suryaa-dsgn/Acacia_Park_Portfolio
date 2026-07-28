/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
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
        "pos-soft": "var(--color-pos-soft)",
        "warn-soft": "var(--color-warn-soft)",
        "neg-soft": "var(--color-neg-soft)",
        "info-soft": "var(--color-info-soft)",
        "invert-bg": "var(--color-invert-bg)",
        "invert-ink": "var(--color-invert-ink)",
        "invert-bar": "var(--color-invert-bar)",
        "invert-track": "var(--color-invert-track)",
        "cat-1": "var(--cat-1)",
        "cat-2": "var(--cat-2)",
        "cat-3": "var(--cat-3)",
        "cat-4": "var(--cat-4)",
        "cat-5": "var(--cat-5)",
        "cat-6": "var(--cat-6)",
        "cat-7": "var(--cat-7)",
      },
      fontFamily: {
        // Headings moved from the Fraunces serif to Geist (rounded sans) per the
        // design review. The `serif` role name is kept so existing `font-serif`
        // heading classes need no per-file edits; it now resolves to Geist.
        serif: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xs: "2px",
        sm: "4px",
        md: "6px",
        pill: "999px",
      },
      fontSize: {
        // Condensed ~12% from the original scale (design review): denser, still
        // readable. Geist runs a touch larger than Fraunces at the same rem, so
        // the reduction also compensates for the family change.
        "display-xl": ["clamp(2.1rem, 1.6rem + 2.4vw, 2.9rem)", { lineHeight: "1.06", letterSpacing: "-0.02em" }],
        "display-lg": ["clamp(1.6rem, 1.3rem + 1.6vw, 2.15rem)", { lineHeight: "1.1", letterSpacing: "-0.015em" }],
        display: ["clamp(1.6rem, 1.3rem + 1.6vw, 2.15rem)", { lineHeight: "1.1", letterSpacing: "-0.015em" }],
        title: ["clamp(1.15rem, 1.05rem + 0.5vw, 1.35rem)", { lineHeight: "1.2", letterSpacing: "-0.01em" }],
        "kpi-value": ["clamp(1.4rem, 1.2rem + 0.9vw, 1.75rem)", { lineHeight: "1.1", letterSpacing: "-0.01em" }],
        "body-lg": ["clamp(0.9375rem, 0.9rem + 0.2vw, 1rem)", { lineHeight: "1.55" }],
        body: ["0.875rem", { lineHeight: "1.5" }],
        data: ["0.875rem", { lineHeight: "1.3" }],
        label: ["clamp(0.65rem, 0.63rem + 0.12vw, 0.7rem)", { lineHeight: "1.2", letterSpacing: "0.1em" }],
        eyebrow: ["0.6875rem", { lineHeight: "1.2", letterSpacing: "0.14em" }],
        caption: ["0.7188rem", { lineHeight: "1.4", letterSpacing: "0.04em" }],
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
      },
      transitionTimingFunction: {
        standard: "cubic-bezier(0.4, 0, 0.2, 1)",
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      maxWidth: {
        container: "1360px",
      },
      screens: {
        // IA section 5 breakpoints: wide >= 1100 (navigator as sidebar), below
        // that the navigator collapses to a drawer.
        shell: "1100px",
      },
    },
  },
  plugins: [],
};
