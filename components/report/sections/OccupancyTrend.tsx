// components/report/sections/OccupancyTrend.tsx
// 12-month occupancy trend (report spec section 8). Current year solid with data
// dots and a latest-point annotation; prior year a quieter line. The current-year
// line stops at the latest reported month (future months are null). The y band is
// derived from the data so movement reads.
import { Panel } from "@/components/primitives/Panel";
import { TrendChart } from "@/components/charts/TrendChart";
import { LegendChip } from "@/components/primitives/LegendChip";
import { toneColor } from "@/lib/semantic";
import { percent } from "@/lib/format";
import { MONTH_ABBR } from "@/lib/report";
import type { QuarterlyReport } from "@/lib/types";

export function OccupancyTrend({ report }: { report: QuarterlyReport }) {
  const s = report.occupancySeries;

  const values = [...s.current, ...s.prior].filter(
    (v): v is number => v != null,
  );
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = Math.max((max - min) * 0.2, 0.005);
  const yDomain: [number, number] = [min - pad, max + pad];

  // latest reported current-year month, for the annotation
  let latest = -1;
  for (let i = s.current.length - 1; i >= 0; i--) {
    if (s.current[i] != null) {
      latest = i;
      break;
    }
  }
  const annotateLatest =
    latest >= 0
      ? `${MONTH_ABBR[latest]}: ${percent(s.current[latest] as number)}`
      : undefined;

  return (
    <Panel eyebrow="12 months" title="Occupancy Trend">
      <TrendChart
        xLabels={MONTH_ABBR}
        yDomain={yDomain}
        series={[
          {
            label: String(s.currentYear),
            color: toneColor("pos"),
            values: s.current,
            dots: true,
            annotateLatest,
          },
          {
            label: String(s.priorYear),
            color: toneColor("info"),
            values: s.prior,
          },
        ]}
      />
      <div className="mt-3 flex gap-4">
        <LegendChip color={toneColor("pos")} label={`${s.currentYear} (current)`} />
        <LegendChip color={toneColor("info")} label={`${s.priorYear} (prior)`} />
      </div>
    </Panel>
  );
}
