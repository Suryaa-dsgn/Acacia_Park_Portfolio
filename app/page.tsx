import { ThemeToggle } from "@/components/shell/ThemeToggle";
import { money, percent, signedPct, ratio, delta } from "@/lib/format";

// Phase 0 foundation page. Proves the token layer, the tri-family type system,
// the semantic four, and the theme toggle in both modes. Replaced by the app
// shell and report in later phases.
const SEMANTIC = [
  { token: "pos", label: "Healthy", swatch: "var(--color-pos)" },
  { token: "warn", label: "Watch", swatch: "var(--color-warn)" },
  { token: "neg", label: "Problem", swatch: "var(--color-neg)" },
  { token: "info", label: "Pending", swatch: "var(--color-info)" },
];

export default function Page() {
  return (
    <main
      id="report"
      className="mx-auto min-h-screen max-w-container px-[clamp(16px,4vw,48px)] py-[clamp(48px,8vh,96px)]"
    >
      <header className="flex items-start justify-between gap-6">
        <div>
          <p className="font-mono text-eyebrow uppercase text-accent">
            Foundation
          </p>
          <h1 className="mt-2 font-serif text-display-lg text-text-serif">
            Portfolio Reporting
          </h1>
          <p className="mt-3 max-w-prose font-sans text-body-lg text-muted">
            A well-set financial broadsheet that happens to be interactive. This
            page proves the token layer, the type system, and both themes before
            any feature is built.
          </p>
        </div>
        <ThemeToggle />
      </header>

      <hr className="my-12 border-hairline" />

      <section className="grid gap-12 md:grid-cols-2">
        <div>
          <p className="font-mono text-label uppercase text-muted">
            Type system
          </p>
          <div className="mt-4 space-y-3">
            <p className="font-serif text-title text-text-serif">
              Fraunces, the display serif
            </p>
            <p className="font-mono text-caption uppercase text-muted">
              IBM Plex Mono, the label voice
            </p>
            <p className="font-sans text-data tabular text-ink">
              Geist Sans, all data values
            </p>
          </div>
        </div>

        <div>
          <p className="font-mono text-label uppercase text-muted">
            Semantic four
          </p>
          <ul className="mt-4 space-y-3">
            {SEMANTIC.map((s) => (
              <li key={s.token} className="flex items-center gap-3">
                <span
                  className="h-3 w-3 rounded-xs"
                  style={{ background: s.swatch }}
                />
                <span className="font-mono text-caption uppercase text-muted">
                  {s.token}
                </span>
                <span className="font-sans text-body text-ink">{s.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <hr className="my-12 border-hairline" />

      <section>
        <p className="font-mono text-label uppercase text-muted">
          Formatters
        </p>
        <div className="mt-4 grid gap-x-8 gap-y-2 font-sans text-data tabular text-ink sm:grid-cols-2 lg:grid-cols-3">
          <span>{money(1769661.34)}</span>
          <span>{percent(0.957237)}</span>
          <span className="text-pos">{signedPct(0.027)}</span>
          <span className="text-neg">{signedPct(-0.318)}</span>
          <span>{ratio(0.92)}</span>
          <span className="text-pos">{delta(5)}</span>
        </div>
      </section>
    </main>
  );
}
