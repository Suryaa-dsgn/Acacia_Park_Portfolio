"use client";
// components/report/sections/PortfolioComposition.tsx
// The Portfolio Composition block (report spec section 13.3), which replaces the
// narrative and images at the holding level. Three views of the same set:
//   1. NOI by property, ranked horizontal brick bars colored by occupancy band
//   2. Occupancy vs NOI per unit, a scatter with dots linking to each report
//   3. All properties, a sortable table linking back to each property
// All links target the property's report for the current quarter (honest
// affordance: every listed property reports this quarter).
import { useMemo, useState } from "react";
import { Panel } from "@/components/primitives/Panel";
import { BrickBar } from "@/components/primitives/BrickBar";
import { LegendChip } from "@/components/primitives/LegendChip";
import { ScatterPlot } from "@/components/charts/ScatterPlot";
import { DataTable, type Column } from "@/components/table/DataTable";
import { SortControl, type SortDir } from "@/components/table/SortControl";
import { occupancyBand, toneColor } from "@/lib/semantic";
import { money, percent, count, signedPct } from "@/lib/format";
import { arrowGlyph } from "@/lib/yoy";
import { propertyHref } from "@/lib/nav";
import type { PropertyComposition, QuarterId } from "@/lib/types";

type SortKey = "noi" | "occupancy" | "name";

function sortProps(
  props: PropertyComposition[],
  key: SortKey,
  dir: SortDir,
): PropertyComposition[] {
  const copy = [...props];
  copy.sort((a, b) => {
    let cmp: number;
    if (key === "name") cmp = a.tradeName.localeCompare(b.tradeName);
    else cmp = a[key] - b[key];
    return dir === "asc" ? cmp : -cmp;
  });
  return copy;
}

function BandLegend() {
  return (
    <div className="flex flex-wrap gap-4">
      <LegendChip color={toneColor("pos")} label="At or above 95%" />
      <LegendChip color={toneColor("warn")} label="90 to 95%" />
      <LegendChip color={toneColor("neg")} label="Below 90%" />
    </div>
  );
}

function YoyNoiCell({ value }: { value: number | null }) {
  if (value === null) return <span className="text-faint">n/a</span>;
  const tone = value >= 0 ? "pos" : "neg";
  const arrow = value > 0 ? "up" : value < 0 ? "down" : "";
  return (
    <span style={{ color: toneColor(tone) }}>
      {arrowGlyph(arrow)} {signedPct(value)}
    </span>
  );
}

export function PortfolioComposition({
  properties,
  quarter,
}: {
  properties: PropertyComposition[];
  quarter: QuarterId;
}) {
  const [key, setKey] = useState<SortKey>("noi");
  const [dir, setDir] = useState<SortDir>("desc");

  const ranked = useMemo(() => sortProps(properties, key, dir), [properties, key, dir]);
  const maxNoi = Math.max(1, ...properties.map((p) => p.noi));

  function onSort(next: string) {
    const k = next as SortKey;
    if (k === key) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setKey(k);
      setDir("desc");
    }
  }

  const columns: Column<PropertyComposition>[] = [
    {
      key: "name",
      header: "Property",
      render: (r) => (
        <div>
          <div className="font-sans text-data font-medium text-ink">{r.tradeName}</div>
          <div className="font-sans text-body text-muted">{r.city}, {r.state}</div>
        </div>
      ),
      sortValue: (r) => r.tradeName,
    },
    { key: "units", header: "Units", align: "right", render: (r) => count(r.units), sortValue: (r) => r.units },
    { key: "noi", header: "Quarter NOI", align: "right", render: (r) => money(r.noi), sortValue: (r) => r.noi },
    {
      key: "occupancy",
      header: "Occupancy",
      align: "right",
      render: (r) => (
        <span style={{ color: toneColor(occupancyBand(r.occupancy)) }}>{percent(r.occupancy)}</span>
      ),
      sortValue: (r) => r.occupancy,
    },
    {
      key: "yoyNoi",
      header: "YoY NOI",
      align: "right",
      render: (r) => <YoyNoiCell value={r.yoyNoi} />,
      sortValue: (r) => r.yoyNoi ?? -Infinity,
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <Panel
        eyebrow="Portfolio"
        title="NOI by Property"
        description="Ranked, each row colored by its occupancy band."
        action={
          <SortControl
            keys={[
              { key: "noi", label: "NOI" },
              { key: "occupancy", label: "Occupancy" },
              { key: "name", label: "Name" },
            ]}
            active={key}
            dir={dir}
            onChange={onSort}
          />
        }
      >
        <div className="flex flex-col gap-2.5">
          {ranked.map((p) => (
            <BrickBar
              key={p.propertyId}
              label={p.tradeName}
              tone={occupancyBand(p.occupancy)}
              fraction={p.noi / maxNoi}
              value={money(p.noi)}
              cells={30}
            />
          ))}
        </div>
        <div className="mt-5">
          <BandLegend />
        </div>
      </Panel>

      <Panel
        eyebrow="Portfolio"
        title="Occupancy vs NOI per Unit"
        description="One dot per property. Click a dot to open its report."
      >
        <div className="max-w-[620px]">
          <ScatterPlot
            xLabel="NOI / Unit"
            yLabel="Physical Occupancy"
            formatX={(n) => money(n)}
            points={properties.map((p) => ({
              x: p.noi / p.units,
              y: p.occupancy,
              tone: occupancyBand(p.occupancy),
              label: p.tradeName,
              yDisplay: percent(p.occupancy),
              href: propertyHref(p.propertyId, quarter),
            }))}
          />
        </div>
        <div className="mt-4">
          <BandLegend />
        </div>
      </Panel>

      <Panel eyebrow="Portfolio" title="All Properties">
        <DataTable
          rows={properties}
          rowKey={(r) => r.propertyId}
          rowHref={(r) => propertyHref(r.propertyId, quarter)}
          caption="All properties, current quarter"
          initialSort="noi"
          initialDir="desc"
          sortKeys={[
            { key: "noi", label: "NOI" },
            { key: "occupancy", label: "Occupancy" },
            { key: "name", label: "Name" },
          ]}
          columns={columns}
        />
      </Panel>
    </div>
  );
}
