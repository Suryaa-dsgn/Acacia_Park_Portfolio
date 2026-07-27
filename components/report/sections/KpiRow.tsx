// components/report/sections/KpiRow.tsx
// Top-line KPI row (report spec section 3). Total Income, Total OpEx, NOI, and
// Physical Occupancy, each with a YoY line whose sign and color follow the
// favorability rule (DM section 5). 4-up desktop, 2-up tablet, 1-up mobile.
import { KpiCard } from "@/components/primitives/KpiCard";
import { money, percent, count } from "@/lib/format";
import { yoy, arrowGlyph, type Yoy } from "@/lib/yoy";
import { isoMonthIndex } from "@/lib/report";
import type { QuarterlyReport } from "@/lib/types";

function yoyLine(y: Yoy): { label: string; tone: Yoy["tone"] } {
  if (y.pct === null) return { label: "n/a", tone: "muted" };
  const arrow = arrowGlyph(y.arrow);
  return { label: `${arrow ? arrow + " " : ""}${y.label} YoY`, tone: y.tone };
}

export function KpiRow({ report }: { report: QuarterlyReport }) {
  const os = report.operatingStatement;
  const rr = report.rentRoll;

  const income = os.totalIncome;
  const opex = os.totalOperatingExpenses;
  const noi = os.netOperatingIncome;

  const incomeYoy = yoy(income.ptdCurrent, income.ptdPrior, "higherIsBetter");
  const opexYoy = yoy(opex.ptdCurrent, opex.ptdPrior, "lowerIsBetter");
  const noiYoy = yoy(noi.ptdCurrent, noi.ptdPrior, "higherIsBetter");

  // Prior-year same-quarter occupancy: the prior series at the period-end month.
  const priorOccMonth = report.occupancySeries.prior[isoMonthIndex(report.meta.periodEnd)];
  const occYoy =
    priorOccMonth != null
      ? yoy(rr.physicalOccupancy, priorOccMonth, "higherIsBetter")
      : null;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 shell:grid-cols-4">
      <KpiCard caption="Total Income (PTD)" value={money(income.ptdCurrent)} yoy={yoyLine(incomeYoy)} />
      <KpiCard caption="Total OpEx (PTD)" value={money(opex.ptdCurrent)} yoy={yoyLine(opexYoy)} />
      <KpiCard caption="NOI (PTD)" value={money(noi.ptdCurrent)} yoy={yoyLine(noiYoy)} />
      <KpiCard
        caption="Physical Occupancy"
        value={percent(rr.physicalOccupancy)}
        yoy={occYoy ? yoyLine(occYoy) : undefined}
        sub={`${count(rr.occupiedUnits)} of ${count(rr.totalUnits)} units`}
      />
    </div>
  );
}
