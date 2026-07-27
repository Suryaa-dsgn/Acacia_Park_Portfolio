// components/report/sections/RentRoll.tsx
// Rent Roll Summary (report spec section 6). A dense labeled metric grid. Counts,
// occupancy percentages, and rents through the shared formatters. Physical and
// Economic Occupancy carry a semantic tone by band (green at or above 95, amber
// 90 to 95, coral below 90).
import { Panel } from "@/components/primitives/Panel";
import { MetricTile } from "@/components/report/MetricTile";
import { money, percent, count } from "@/lib/format";
import { occupancyBand } from "@/lib/semantic";
import { usDate } from "@/lib/report";
import type { QuarterlyReport } from "@/lib/types";

export function RentRoll({ report }: { report: QuarterlyReport }) {
  const rr = report.rentRoll;
  return (
    <Panel eyebrow={`As of ${usDate(rr.asOf)}`} title="Rent Roll Summary">
      <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 shell:grid-cols-4">
        <MetricTile label="Total Units" value={count(rr.totalUnits)} />
        <MetricTile label="Occupied Units" value={count(rr.occupiedUnits)} />
        <MetricTile label="Vacant Units" value={count(rr.vacantUnits)} />
        <MetricTile
          label="Physical Occupancy"
          value={percent(rr.physicalOccupancy)}
          tone={occupancyBand(rr.physicalOccupancy)}
        />
        <MetricTile label="Total SF" value={count(rr.totalSqFt)} />
        <MetricTile label="Avg Unit Sq Ft" value={count(rr.avgUnitSqFt)} />
        <MetricTile label="Avg Unit Rent" value={money(rr.avgUnitRent)} />
        <MetricTile label="Avg Occupied Unit Rent" value={money(rr.avgOccupiedUnitRent)} />
        <MetricTile label="Avg Resident Rent" value={money(rr.avgResidentRent)} />
        <MetricTile label="Total Market Rent" value={money(rr.totalMarketRent)} />
        <MetricTile label="Total Unit Rent (in place)" value={money(rr.totalInPlaceRent)} />
        <MetricTile
          label="Economic Occupancy"
          value={percent(rr.economicOccupancy)}
          tone={occupancyBand(rr.economicOccupancy)}
        />
      </div>
    </Panel>
  );
}
