// components/report/sections/Financials.tsx
// The Financials block. Two rows, each rendered as ONE shared bg-panel container
// so both columns always share the same visual box — no height-mismatch gaps.
// Sections inside each row are transparent (no individual card styling); standalone
// border divs provide the hairline separators between sections.
import { Panel } from "@/components/primitives/Panel";
import { LegendChip } from "@/components/primitives/LegendChip";
import { OperatingStatement } from "./OperatingStatement";
import { OccupancyTrend } from "./OccupancyTrend";
import { RentRoll } from "./RentRoll";
import { Leasing } from "./Leasing";
import { GroupedBarChart } from "@/components/charts/GroupedBarChart";
import { PieChart } from "@/components/charts/PieChart";
import { statementColumns } from "@/lib/report";
import { money, percent } from "@/lib/format";
import { CATEGORICAL } from "@/lib/semantic";
import type { QuarterlyReport } from "@/lib/types";

const INSET = "!bg-transparent !border-0 !rounded-none ![box-shadow:none]";

function Divider() {
  return <div className="border-t border-hairline" aria-hidden="true" />;
}

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
      className={INSET}
    >
      <GroupedBarChart
        groups={groups}
        priorLabel={cols.prior}
        currentLabel={cols.current}
        height={182}
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
    <Panel
      eyebrow="Performance"
      title="Operating Expense Breakdown"
      className={INSET}
    >
      <div className="flex items-start gap-8">
        <div className="shrink-0">
          <PieChart segments={segments} size={144} />
        </div>
        <div className="flex flex-col gap-1.5 min-w-0 flex-1">
          {segments.map((s) => (
            <LegendChip
              key={s.label}
              color={s.color}
              label={s.label}
              value={percent(s.value / opexTotal)}
            />
          ))}
          <p className="mt-3 font-mono text-caption uppercase tracking-[0.08em] text-muted">
            Total OpEx: {money(opexTotal)}
          </p>
        </div>
      </div>
    </Panel>
  );
}

export function Financials({ report }: { report: QuarterlyReport }) {
  return (
    <div className="flex flex-col gap-6">

      {/* Row 1: one shared box */}
      <div className="rounded-md border border-hairline bg-panel overflow-hidden">
        <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr]">
          <OperatingStatement report={report} className={INSET} />
          {/* Right col: column divider via wrapper, horizontal divider via Divider */}
          <div className="flex flex-col border-t border-hairline xl:border-t-0 xl:border-l xl:border-hairline">
            <YearOverYearBars report={report} />
            <Divider />
            <OperatingExpensePie report={report} />
          </div>
        </div>
      </div>

      {/* Row 2: one shared box */}
      <div className="rounded-md border border-hairline bg-panel overflow-hidden">
        <div className="grid grid-cols-1 xl:grid-cols-2">
          <div className="flex flex-col">
            <Leasing report={report} className={INSET} />
            <Divider />
            <RentRoll report={report} className={INSET} />
          </div>
          {/* Occupancy: column divider via wrapper */}
          <div className="border-t border-hairline xl:border-t-0 xl:border-l xl:border-hairline">
            <OccupancyTrend report={report} className={INSET} />
          </div>
        </div>
      </div>

    </div>
  );
}
