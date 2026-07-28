// components/report/sections/OccupancyTrend.tsx
// Occupancy and rent growth (report spec section 8, redesigned). Two full years
// of monthly physical occupancy (grouped bars) and average in-place rent (lines)
// on a dual axis, matching the governed Excel view. Falls back to a quiet note if
// the two-year history is not present for a quarter.
import { Panel } from "@/components/primitives/Panel";
import { OccupancyRentCombo } from "@/components/charts/OccupancyRentCombo";
import { MONTH_ABBR } from "@/lib/report";
import type { QuarterlyReport } from "@/lib/types";

export function OccupancyTrend({ report, className }: { report: QuarterlyReport; className?: string }) {
  const h = report.occupancyRentHistory;

  return (
    <Panel
      eyebrow="Two years"
      title="Occupancy and Rent Growth"
      description="Monthly physical occupancy (bars, right axis) and average in-place rent (lines, left axis)."
      className={className}
    >
      {h ? (
        <OccupancyRentCombo
          months={MONTH_ABBR}
          years={h.years}
          occupancy={h.occupancy}
          avgInPlaceRent={h.avgInPlaceRent}
          height={338}
        />
      ) : (
        <p className="font-sans text-body italic text-muted">
          Two-year occupancy and rent history is not available for this quarter.
        </p>
      )}
    </Panel>
  );
}
