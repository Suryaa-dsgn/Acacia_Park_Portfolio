"use client";
// app/gallery/page.tsx
// Dev-only primitives gallery (build plan Phase 1). Every design-system
// primitive is shown in dark and light side by side, so the guideline can be
// checked at a glance: hairlines, tabular numbers, radii, semantic colors, and
// motion. Not part of the shipping app surface; a reference harness.
import { useState } from "react";
import { ThemeFrame } from "@/components/gallery/ThemeFrame";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { Panel } from "@/components/primitives/Panel";
import { KpiCard } from "@/components/primitives/KpiCard";
import { StatusTag } from "@/components/primitives/StatusTag";
import { LegendChip } from "@/components/primitives/LegendChip";
import { Button } from "@/components/primitives/Button";
import { Link } from "@/components/primitives/Link";
import { SegmentedToggle } from "@/components/primitives/SegmentedToggle";
import { Brick } from "@/components/primitives/Brick";
import { BrickBar } from "@/components/primitives/BrickBar";
import { Waffle } from "@/components/primitives/Waffle";
import { ScatterPlot } from "@/components/charts/ScatterPlot";
import { TrendChart } from "@/components/charts/TrendChart";
import { FunnelBars } from "@/components/charts/FunnelBars";
import { DataTable, type Column } from "@/components/table/DataTable";
import { toneColor, occupancyBand, CATEGORICAL } from "@/lib/semantic";
import { money, percent, signedPct, count } from "@/lib/format";

function Row({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-14">
      <h2 className="font-serif text-title text-text-serif">{title}</h2>
      {note && (
        <p className="mt-1 max-w-prose font-sans text-body text-muted">{note}</p>
      )}
      <div className="mt-5 flex flex-col gap-4 lg:flex-row">
        <ThemeFrame theme="dark">{children}</ThemeFrame>
        <ThemeFrame theme="light">{children}</ThemeFrame>
      </div>
    </section>
  );
}

function SegToggleDemo() {
  const [range, setRange] = useState<"3m" | "6m" | "12m">("12m");
  return (
    <SegmentedToggle
      ariaLabel="Trend range"
      value={range}
      onChange={setRange}
      segments={[
        { value: "3m", label: "3M" },
        { value: "6m", label: "6M" },
        { value: "12m", label: "12M" },
      ]}
    />
  );
}

// Sample property data for BrickBar, ScatterPlot, DataTable, all clearly fixture.
interface PropRow {
  id: string;
  name: string;
  city: string;
  units: number;
  noi: number;
  occ: number;
  yoy: number;
}
const PROPERTIES: PropRow[] = [
  { id: "acacia", name: "Universe at Acacia", city: "San Bernardino, CA", units: 304, noi: 550205, occ: 0.957, yoy: -0.318 },
  { id: "brightwater", name: "Brightwater Commons", city: "Austin, TX", units: 218, noi: 612400, occ: 0.972, yoy: 0.041 },
  { id: "cedarfield", name: "Cedarfield Flats", city: "Denver, CO", units: 156, noi: 388900, occ: 0.923, yoy: -0.052 },
  { id: "dunmore", name: "Dunmore Yards", city: "Columbus, OH", units: 402, noi: 741050, occ: 0.889, yoy: 0.128 },
  { id: "elmgrove", name: "Elm Grove Residences", city: "Raleigh, NC", units: 275, noi: 505600, occ: 0.948, yoy: 0.017 },
];

const OPEX = [
  { label: "Payroll / Labor", value: 402000 },
  { label: "Utilities", value: 268000 },
  { label: "Repairs & Maintenance", value: 205000 },
  { label: "Fixed Expenses", value: 174000 },
  { label: "General & Admin", value: 96000 },
  { label: "Marketing", value: 74000 },
];

export default function GalleryPage() {
  const noiMax = Math.max(...PROPERTIES.map((p) => p.noi));

  const columns: Column<PropRow>[] = [
    {
      key: "name",
      header: "Property",
      render: (r) => (
        <div>
          <div className="font-sans text-data font-medium text-ink">{r.name}</div>
          <div className="font-sans text-body text-muted">{r.city}</div>
        </div>
      ),
      sortValue: (r) => r.name,
    },
    { key: "units", header: "Units", align: "right", render: (r) => count(r.units), sortValue: (r) => r.units },
    { key: "noi", header: "Quarter NOI", align: "right", render: (r) => money(r.noi), sortValue: (r) => r.noi },
    {
      key: "occ",
      header: "Occupancy",
      align: "right",
      render: (r) => (
        <span style={{ color: toneColor(occupancyBand(r.occ)) }}>{percent(r.occ)}</span>
      ),
      sortValue: (r) => r.occ,
    },
    {
      key: "yoy",
      header: "YoY NOI",
      align: "right",
      render: (r) => (
        <span style={{ color: toneColor(r.yoy >= 0 ? "pos" : "neg") }}>
          {r.yoy >= 0 ? "▲" : "▼"} {signedPct(r.yoy)}
        </span>
      ),
      sortValue: (r) => r.yoy,
    },
  ];

  return (
    <main className="mx-auto max-w-[1400px] px-[clamp(16px,4vw,48px)] py-16">
      <Eyebrow>Design System</Eyebrow>
      <h1 className="mt-2 font-serif text-display-lg text-text-serif">
        Primitives gallery
      </h1>
      <p className="mt-3 max-w-prose font-sans text-body-lg text-muted">
        Every primitive, in both themes, with sample fixture props. A reference
        harness for Phase 1, not a shipping surface.
      </p>

      <hr className="my-10 border-hairline" />

      <Row title="Eyebrow and Panel" note="Section container with mono eyebrow, serif title, and a muted description.">
        <Panel
          eyebrow="Operating Statement"
          title="Universe at Acacia"
          description="One property, one quarter, at a glance."
          action={<Button>Export Excel {"→"}</Button>}
        >
          <p className="font-sans text-body text-ink">Panel body content.</p>
        </Panel>
      </Row>

      <Row title="KPI cards" note="Mono caption, large tabular value, semantic sub-caption.">
        <div className="grid grid-cols-2 gap-3">
          <KpiCard caption="Total Income" value={money(1769661)} sub="+6.0% YoY" subTone="pos" />
          <KpiCard caption="Total OpEx" value={money(1219457)} sub="+41.4% YoY" subTone="neg" />
          <KpiCard caption="NOI" value={money(550205)} sub="-31.8% YoY" subTone="neg" />
          <KpiCard caption="Physical Occupancy" value={percent(0.957)} sub="291 of 304 units" subTone="pos" />
        </div>
      </Row>

      <Row title="Status tags" note="Narrative authoring status and generic health and action tags.">
        <div className="flex flex-wrap items-center gap-2">
          <StatusTag variant="completed" />
          <StatusTag variant="in-progress" />
          <StatusTag variant="gathering" />
          <StatusTag variant="not-started" />
          <StatusTag variant="action">View Report {"→"}</StatusTag>
        </div>
      </Row>

      <Row title="Legend chips" note="Color paired with a text label, never color alone.">
        <div className="flex flex-wrap gap-4">
          <LegendChip color={toneColor("pos")} label="At or above 95%" />
          <LegendChip color={toneColor("warn")} label="90 to 95%" />
          <LegendChip color={toneColor("neg")} label="Below 90%" />
          <LegendChip color={toneColor("info")} label="Signed applicant" />
        </div>
      </Row>

      <Row title="Buttons, links, segmented toggle">
        <div className="flex flex-wrap items-center gap-4">
          <Button>Report Builder {"→"}</Button>
          <Button disabled>Preparing</Button>
          <Link href="#" arrow>
            Open the full explorer
          </Link>
          <SegToggleDemo />
        </div>
      </Row>

      <Row title="Bricks" note="One square equals one countable thing. Hover a brick to raise it and read its status.">
        <div className="flex items-center gap-1.5">
          <Brick color={toneColor("pos")} tooltip="Unit 101: Occupied" interactive size={18} />
          <Brick color={toneColor("pos")} tooltip="Unit 102: Occupied" interactive size={18} />
          <Brick color={toneColor("warn")} tooltip="Unit 103: On notice" interactive size={18} />
          <Brick color={toneColor("neg")} tooltip="Unit 104: Vacant" interactive size={18} />
          <Brick color={toneColor("info")} tooltip="Unit 105: Signed" interactive size={18} />
          <Brick color="var(--color-border)" size={18} />
          <Brick color="var(--color-border)" size={18} />
        </div>
      </Row>

      <Row title="Brick bars (NOI by property)" note="Each row colored by its occupancy band, filled against the list max.">
        <div className="flex flex-col gap-2.5">
          {PROPERTIES.map((p) => (
            <BrickBar
              key={p.id}
              label={p.name}
              tone={occupancyBand(p.occ)}
              fraction={p.noi / noiMax}
              value={money(p.noi)}
            />
          ))}
        </div>
      </Row>

      <Row title="Waffle (operating expense breakdown)" note="Each brick a share of total OpEx, colored by category in fixed order.">
        <div className="flex flex-wrap items-start gap-6">
          <Waffle
            segments={OPEX.map((o, i) => ({
              label: o.label,
              value: o.value,
              color: CATEGORICAL[i % CATEGORICAL.length],
            }))}
          />
          <div className="flex flex-col gap-2">
            {OPEX.map((o, i) => (
              <LegendChip
                key={o.label}
                color={CATEGORICAL[i % CATEGORICAL.length]}
                label={o.label}
                value={percent(o.value / OPEX.reduce((a, b) => a + b.value, 0))}
              />
            ))}
          </div>
        </div>
      </Row>

      <Row title="Scatter plot (occupancy vs NOI per unit)" note="One dot per property, colored by occupancy band. Hover to read, linkable dots ring on hover.">
        <div className="max-w-[560px]">
          <ScatterPlot
            xLabel="NOI / Unit"
            yLabel="Physical Occupancy"
            formatX={(n) => money(n)}
            points={PROPERTIES.map((p) => ({
              x: p.noi / p.units,
              y: p.occ,
              tone: occupancyBand(p.occ),
              label: p.name,
              yDisplay: percent(p.occ),
              href: "#",
            }))}
          />
        </div>
      </Row>

      <Row title="Trend chart (12-month occupancy)" note="Current year solid with dots and a latest-point annotation, prior year quieter, with a target line.">
        <div className="max-w-[600px]">
          <TrendChart
            xLabels={["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]}
            yDomain={[0.88, 0.99]}
            target={{ value: 0.955, label: "95.5% target", tone: "warn" }}
            series={[
              {
                label: "2026",
                color: toneColor("pos"),
                dots: true,
                annotateLatest: "May: 93.5%",
                values: [0.9312, 0.9397, 0.9402, 0.9359, 0.9349, null, null, null, null, null, null, null],
              },
              {
                label: "2025",
                color: toneColor("info"),
                values: [0.921, 0.925, 0.931, 0.938, 0.942, 0.949, 0.951, 0.948, 0.944, 0.939, 0.933, 0.928],
              },
            ]}
          />
          <div className="mt-3 flex gap-4">
            <LegendChip color={toneColor("pos")} label="2026 (current)" />
            <LegendChip color={toneColor("info")} label="2025 (prior)" />
          </div>
        </div>
      </Row>

      <Row title="Funnel bars (leasing activity)" note="Horizontal brick bars, each stage in its own semantic tone.">
        <FunnelBars
          rows={[
            { label: "Move-ins", value: 28, tone: "pos" },
            { label: "Move-outs", value: 23, tone: "warn" },
            { label: "Notices", value: 22, tone: "warn" },
            { label: "Renewals", value: 48, tone: "pos" },
            { label: "Evictions", value: 2, tone: "neg" },
          ]}
        />
      </Row>

      <Row title="Data table (all properties)" note="Semantic table, mono header, hairline rows, sortable, linkable rows.">
        <DataTable
          rows={PROPERTIES}
          rowKey={(r) => r.id}
          rowHref={() => "#"}
          caption="All properties, current quarter"
          initialSort="noi"
          sortKeys={[
            { key: "noi", label: "NOI" },
            { key: "occ", label: "Occupancy" },
            { key: "name", label: "Name" },
          ]}
          columns={columns}
        />
      </Row>
    </main>
  );
}
