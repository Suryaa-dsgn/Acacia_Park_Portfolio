// components/report/ReportPlaceholder.tsx
// Phase 3 main pane. Confirms that the selected (scope, quarter) resolves to
// governed data by rendering the composed period eyebrow and the report
// identity, then a quiet note that the report body arrives in the next phase.
// The full report sections (KPIs, statement, visuals) are built in Phase 4.
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { Panel } from "@/components/primitives/Panel";
import { quarterShortLabel } from "@/lib/quarter";
import { count } from "@/lib/format";
import type { QuarterlyReport } from "@/lib/types";

export function ReportPlaceholder({ report }: { report: QuarterlyReport }) {
  const { identity, meta } = report;
  const isHolding = identity.kind === "holding";
  const eyebrow = isHolding
    ? `Portfolio roll-up · ${quarterShortLabel(meta.quarter)}`
    : `Quarterly Operating Report · ${quarterShortLabel(meta.quarter)}`;
  const title = isHolding ? identity.label : identity.tradeName;
  const subline = isHolding
    ? `${count(identity.propertyCount)} properties · ${count(identity.totalUnits)} units · ${count(identity.totalSqFt)} SF`
    : `${identity.addressLine} · ${identity.cityStateZip}`;

  return (
    <div className="space-y-8">
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="mt-2 font-serif text-display-lg text-text-serif">
          {title}
        </h1>
        <p className="mt-2 font-sans text-body text-muted">{subline}</p>
      </div>

      <Panel eyebrow="Frame ready" title="Report body renders in the next phase">
        <p className="max-w-prose font-sans text-body text-muted">
          The shell, navigation, quarter selector, routing, and data wiring are
          in place. This pane confirms the selected scope and quarter resolve to
          governed data. The KPI row, operating statement, performance visuals,
          rent roll, leasing, occupancy trend, narrative, and audit sections are
          built next.
        </p>
      </Panel>
    </div>
  );
}
