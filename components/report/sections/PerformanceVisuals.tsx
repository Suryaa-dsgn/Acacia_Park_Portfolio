// components/report/sections/PerformanceVisuals.tsx
// Performance visuals (report spec section 5). Left: Income, Expenses, and NOI as
// horizontal brick bars scaled to the largest of the three. Right: the operating
// expense breakdown as a waffle with a legend. Both use the asset library, not a
// generic chart default.
import { Panel } from "@/components/primitives/Panel";
import { BrickBar } from "@/components/primitives/BrickBar";
import { Waffle } from "@/components/primitives/Waffle";
import { LegendChip } from "@/components/primitives/LegendChip";
import { money, percent } from "@/lib/format";
import { CATEGORICAL } from "@/lib/semantic";
import type { QuarterlyReport } from "@/lib/types";

export function PerformanceVisuals({ report }: { report: QuarterlyReport }) {
  const os = report.operatingStatement;
  const income = os.totalIncome.ptdCurrent;
  const opex = os.totalOperatingExpenses.ptdCurrent;
  const noi = os.netOperatingIncome.ptdCurrent;
  const scaleMax = Math.max(income, opex, Math.max(noi, 0)) || 1;

  const opexTotal = os.totalOperatingExpenses.ptdCurrent;
  const segments = os.expenses.map((line, i) => ({
    label: line.label,
    value: line.ptdCurrent,
    color: CATEGORICAL[i % CATEGORICAL.length],
  }));

  return (
    <div className="grid grid-cols-1 gap-6">
      <Panel eyebrow="Performance" title="Income, Expenses, NOI">
        <div className="flex flex-col gap-4">
          <BrickBar label="Total Income" tone="pos" fraction={income / scaleMax} value={money(income)} cells={24} />
          <BrickBar label="Total OpEx" tone="warn" fraction={opex / scaleMax} value={money(opex)} cells={24} />
          <BrickBar
            label="Net Operating Income"
            tone={noi >= 0 ? "pos" : "neg"}
            fraction={Math.max(noi, 0) / scaleMax}
            value={money(noi)}
            cells={24}
          />
        </div>
      </Panel>

      <Panel eyebrow="Performance" title="Operating Expense Breakdown">
        <div className="flex flex-row flex-wrap items-start gap-6">
          <Waffle segments={segments} cellSize={14} />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            {segments.map((s) => (
              <LegendChip
                key={s.label}
                color={s.color}
                label={s.label}
                value={percent(s.value / opexTotal)}
              />
            ))}
          </div>
        </div>
        <p className="mt-6 font-mono text-caption uppercase tracking-[0.08em] text-muted">
          Total OpEx: {money(opexTotal)}
        </p>
      </Panel>
    </div>
  );
}
