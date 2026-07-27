// components/report/sections/Leasing.tsx
// Leasing Activity (report spec section 7). Metric tiles plus a funnel of
// horizontal brick bars. Net Absorption shows a signed, semantically colored
// value. Funnel stages are toned: move-ins and renewals positive, move-outs and
// notices watch, evictions problem.
import { Panel } from "@/components/primitives/Panel";
import { MetricTile } from "@/components/report/MetricTile";
import { FunnelBars } from "@/components/charts/FunnelBars";
import { count, delta } from "@/lib/format";
import type { QuarterlyReport } from "@/lib/types";

export function Leasing({ report }: { report: QuarterlyReport }) {
  const l = report.leasing;
  if (!l) {
    return (
      <Panel eyebrow="This quarter" title="Leasing Activity">
        <p className="font-sans text-body italic text-muted">
          Not governed for this quarter.
        </p>
      </Panel>
    );
  }
  return (
    <Panel eyebrow="This quarter" title="Leasing Activity">
      <div className="grid grid-cols-1 gap-6">
        <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
          <MetricTile label="Move-Ins" value={count(l.moveIns)} />
          <MetricTile label="Move-Outs" value={count(l.moveOuts)} />
          <MetricTile
            label="Net Absorption"
            value={delta(l.netAbsorption)}
            tone={l.netAbsorption >= 0 ? "pos" : "neg"}
          />
          <MetricTile label="Notices to Vacate" value={count(l.noticesToVacate)} />
          <MetricTile label="Units Rented" value={count(l.unitsRented)} />
          <MetricTile label="Renewals" value={count(l.renewals)} />
          <MetricTile label="Evictions" value={count(l.evictions)} />
        </div>

        <FunnelBars
          rows={[
            { label: "Move-ins", value: l.moveIns, tone: "pos" },
            { label: "Move-outs", value: l.moveOuts, tone: "warn" },
            { label: "Notices", value: l.noticesToVacate, tone: "warn" },
            { label: "Renewals", value: l.renewals, tone: "pos" },
            { label: "Evictions", value: l.evictions, tone: "neg" },
          ]}
        />
      </div>
    </Panel>
  );
}
