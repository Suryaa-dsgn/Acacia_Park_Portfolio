// components/report/sections/Ratios.tsx
// Derived operating ratios (legacy "Ratios" tab). Grouped tiles that mirror the
// rent-roll / leasing metric grids, with the formula shown as a quiet caption so
// every number is auditable at a glance. Only ratios the governed source supports
// are shown; the rest are named in a footnote (see lib/ratios OMITTED_RATIOS).
import { Panel } from "@/components/primitives/Panel";
import { computeRatios, OMITTED_RATIOS, type RatioItem } from "@/lib/ratios";
import { money, moneyExact, percent } from "@/lib/format";
import type { QuarterlyReport } from "@/lib/types";

function formatRatio(item: RatioItem): string {
  if (item.value === null) return "n/a";
  switch (item.format) {
    case "percent":
      return percent(item.value);
    case "money":
      return money(item.value);
    case "money2":
      return moneyExact(item.value);
  }
}

function RatioTile({ item }: { item: RatioItem }) {
  // Matches MetricTile's label/value language, plus a formula caption.
  return (
    <div className="border-l border-hairline pl-3">
      <div className="font-mono text-caption uppercase tracking-[0.08em] text-muted">
        {item.label}
      </div>
      <div className="mt-1 font-sans text-data tabular text-ink">
        {formatRatio(item)}
      </div>
      <div className="mt-1 font-mono text-caption text-faint">{item.formula}</div>
    </div>
  );
}

export function Ratios({ report }: { report: QuarterlyReport }) {
  const groups = computeRatios(report);

  return (
    <Panel
      eyebrow="This quarter"
      title="Ratios"
      description="Computed from this quarter's governed figures. Each tile shows its formula."
    >
      <div className="flex flex-col gap-7">
        {groups.map((group) => (
          <div key={group.group}>
            <h3 className="mb-3 font-mono text-label uppercase tracking-[0.08em] text-muted">
              {group.group}
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-4">
              {group.items.map((item) => (
                <RatioTile key={item.key} item={item} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-7 max-w-prose font-sans text-caption text-faint">
        Not shown, as the governed source lacks the inputs: {OMITTED_RATIOS.join(", ")}.
        These need debt service, capital, delinquency, or full GL detail not present
        in the quarterly export.
      </p>
    </Panel>
  );
}
