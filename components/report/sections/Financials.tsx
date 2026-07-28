// components/report/sections/Financials.tsx
// The Financials block (design review). Two responsive rows that use the width:
//   Row A: Operating Statement table | Year-over-Year grouped bar chart
//   Row B: Operating Expense pie      | Occupancy + Rent Growth combo
// Each cell is a Panel. Rows stack on narrow widths so nothing crowds, and go
// side by side on wide screens.
import { Panel } from "@/components/primitives/Panel";
import { LegendChip } from "@/components/primitives/LegendChip";
import { OperatingStatement } from "./OperatingStatement";
import { OccupancyTrend } from "./OccupancyTrend";
import { RentRoll } from "./RentRoll";
import { GroupedBarChart } from "@/components/charts/GroupedBarChart";
import { PieChart } from "@/components/charts/PieChart";
import { statementColumns } from "@/lib/report";
import { money, percent } from "@/lib/format";
import { CATEGORICAL } from "@/lib/semantic";
import type { QuarterlyReport } from "@/lib/types";

function YearOverYearBars({ report }: { report: QuarterlyReport }) {
  const os = report.operatingStatement;
  const cols = statementColumns(report.meta);
  const groups = [
    { label: "Income", prior: os.totalIncome.ptdPrior, current: os.totalIncome.ptdCurrent },
    { label: "Expenses", prior: os.totalOperatingExpenses.ptdPrior, current: os.totalOperatingExpenses.ptdCurrent },
    { label: "NOI", prior: os.netOperatingIncome.ptdPrior, current: os.netOperatingIncome.ptdCurrent },
  ];
  return (
    <Panel
      eyebrow="Financials"
      title="Year over Year"
      description="Total income, operating expenses, and NOI, prior versus current year."
    >
      <GroupedBarChart
        groups={groups}
        priorLabel={cols.prior}
        currentLabel={cols.current}
        height={200}
      />
    </Panel>
  );
}

function OperatingExpensePie({ report }: { report: QuarterlyReport }) {
  const os = report.operatingStatement;
  const opexTotal = os.totalOperatingExpenses.ptdCurrent;
  const segments = os.expenses.map((line, i) => ({
    label: line.label,
    value: line.ptdCurrent,
    color: CATEGORICAL[i % CATEGORICAL.length],
  }));
  return (
    <Panel eyebrow="Performance" title="Operating Expense Breakdown">
      <div className="flex flex-col items-center gap-4">
        <PieChart segments={segments} size={160} />
        <div className="w-full flex flex-col gap-1.5">
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
      <p className="mt-5 font-mono text-caption uppercase tracking-[0.08em] text-muted">
        Total OpEx: {money(opexTotal)}
      </p>
    </Panel>
  );
}

export function Financials({ report }: { report: QuarterlyReport }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr] xl:items-start">
        <OperatingStatement report={report} />
        <div className="flex flex-col gap-4">
          <YearOverYearBars report={report} />
          <OperatingExpensePie report={report} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <RentRoll report={report} />
        <OccupancyTrend report={report} />
      </div>
    </div>
  );
}
