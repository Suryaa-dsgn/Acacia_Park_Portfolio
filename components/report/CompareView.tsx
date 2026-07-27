"use client";
// components/report/CompareView.tsx
// Compare up to five properties for a quarter (legacy "Compare" surface). A
// metric matrix with best-in-row highlighting, NOI brick bars, and NOI /
// occupancy trend charts. Reuses the report primitives; property identity color
// (categorical) ties each column to its trend line. NOI bars stay colored by
// occupancy band, matching the portfolio composition language.
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { revealContainer, revealItem, revealItemReduced } from "@/lib/motion";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { Panel } from "@/components/primitives/Panel";
import { BrickBar } from "@/components/primitives/BrickBar";
import { TrendChart } from "@/components/charts/TrendChart";
import { money, percent, count } from "@/lib/format";
import { CATEGORICAL, occupancyBand, toneColor } from "@/lib/semantic";
import type { RatioFormat } from "@/lib/ratios";

export interface CompareProperty {
  propertyId: string;
  tradeName: string;
  cityState: string;
  units: number;
  totalIncome: number;
  noi: number;
  physicalOccupancy: number;
  economicOccupancy: number;
  vacantUnits: number;
  ratios: { key: string; label: string; value: number | null; format: RatioFormat }[];
  noiSeries: (number | null)[];
  occSeries: (number | null)[];
}

const MAX_SELECTED = 5;

type Dir = "higher" | "lower";

interface MetricDef {
  key: string;
  label: string;
  get: (p: CompareProperty) => number | null;
  format: (v: number) => string;
  dir: Dir;
}

function ratioValue(p: CompareProperty, key: string): number | null {
  return p.ratios.find((r) => r.key === key)?.value ?? null;
}

const METRICS: MetricDef[] = [
  { key: "totalIncome", label: "Total Income (PTD)", get: (p) => p.totalIncome, format: money, dir: "higher" },
  { key: "noi", label: "Net Operating Income", get: (p) => p.noi, format: money, dir: "higher" },
  { key: "physOcc", label: "Physical Occupancy", get: (p) => p.physicalOccupancy, format: percent, dir: "higher" },
  { key: "econOcc", label: "Economic Occupancy", get: (p) => p.economicOccupancy, format: percent, dir: "higher" },
  { key: "vacant", label: "Vacant Units", get: (p) => p.vacantUnits, format: (v) => count(v), dir: "lower" },
  { key: "noiMargin", label: "NOI Margin", get: (p) => ratioValue(p, "noiMargin"), format: percent, dir: "higher" },
  { key: "opexRatio", label: "Operating Expense Ratio", get: (p) => ratioValue(p, "opexRatio"), format: percent, dir: "lower" },
];

// Indexes of the properties that hold the best value in a row (ties included).
function bestIndexes(values: (number | null)[], dir: Dir): Set<number> {
  const present = values
    .map((v, i) => ({ v, i }))
    .filter((x): x is { v: number; i: number } => x.v !== null);
  if (present.length < 2) return new Set();
  const best = present.reduce((acc, x) =>
    dir === "higher" ? (x.v > acc.v ? x : acc) : x.v < acc.v ? x : acc,
  );
  return new Set(present.filter((x) => x.v === best.v).map((x) => x.i));
}

export function CompareView({
  quarter,
  quarterLabels,
  properties,
}: {
  quarter: string;
  quarterLabels: string[];
  properties: CompareProperty[];
}) {
  const reduced = useReducedMotion();
  const item = reduced ? revealItemReduced : revealItem;

  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(properties.slice(0, MAX_SELECTED).map((p) => p.propertyId)),
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < MAX_SELECTED) next.add(id);
      return next;
    });
  }

  // Stable identity color per property (categorical), by original order.
  const colorOf = new Map(
    properties.map((p, i) => [p.propertyId, CATEGORICAL[i % CATEGORICAL.length]]),
  );

  const chosen = properties.filter((p) => selected.has(p.propertyId));
  const maxNoi = Math.max(1, ...chosen.map((p) => Math.max(p.noi, 0)));

  const Section = ({ children }: { children: React.ReactNode }) => (
    <motion.section variants={item}>{children}</motion.section>
  );

  return (
    <motion.div
      variants={revealContainer}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-10"
    >
      <Section>
        <header>
          <Eyebrow>Compare</Eyebrow>
          <h1 className="mt-2 font-serif text-display-lg text-text-serif">
            Properties, side by side
          </h1>
          <p className="mt-2 max-w-prose font-sans text-body-lg text-muted">
            Pick up to five properties to compare this quarter&apos;s financials.
            As more quarters are imported, the trend charts fill in over time.
          </p>
        </header>
      </Section>

      <Section>
        <Panel eyebrow="Selection" title={`Properties (${selected.size} of ${MAX_SELECTED})`}>
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            {properties.map((p) => {
              const on = selected.has(p.propertyId);
              const atCap = !on && selected.size >= MAX_SELECTED;
              return (
                <label
                  key={p.propertyId}
                  className={
                    "flex items-center gap-2.5 " +
                    (atCap ? "cursor-not-allowed opacity-40" : "cursor-pointer")
                  }
                >
                  <input
                    type="checkbox"
                    checked={on}
                    disabled={atCap}
                    onChange={() => toggle(p.propertyId)}
                    className="h-4 w-4 accent-accent"
                  />
                  <span
                    aria-hidden
                    className="h-2.5 w-2.5 shrink-0 rounded-xs"
                    style={{ background: colorOf.get(p.propertyId) }}
                  />
                  <span className="font-sans text-body text-ink">{p.tradeName}</span>
                  <span className="font-mono text-caption tabular text-muted">
                    {money(p.noi)}
                  </span>
                </label>
              );
            })}
          </div>
        </Panel>
      </Section>

      {chosen.length === 0 ? (
        <Section>
          <Panel>
            <p className="font-sans text-body italic text-muted">
              Select at least one property to compare.
            </p>
          </Panel>
        </Section>
      ) : (
        <>
          <Section>
            <Panel eyebrow="This quarter" title="Metrics">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] border-collapse">
                  <thead>
                    <tr>
                      <th className="border-b border-hairline pb-2 text-left font-mono text-label uppercase text-muted" />
                      {chosen.map((p) => (
                        <th
                          key={p.propertyId}
                          className="border-b border-hairline pb-2 pl-4 text-right font-mono text-label uppercase text-muted"
                        >
                          <span className="inline-flex items-center gap-2">
                            <span
                              aria-hidden
                              className="h-2.5 w-2.5 rounded-xs"
                              style={{ background: colorOf.get(p.propertyId) }}
                            />
                            {p.tradeName}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {METRICS.map((m) => {
                      const values = chosen.map((p) => m.get(p));
                      const best = bestIndexes(values, m.dir);
                      return (
                        <tr key={m.key} className="border-b border-hairline">
                          <th
                            scope="row"
                            className="py-2.5 pr-4 text-left font-sans text-body font-normal text-muted"
                          >
                            {m.label}
                          </th>
                          {values.map((v, i) => (
                            <td
                              key={chosen[i].propertyId}
                              className="py-2.5 pl-4 text-right font-sans text-data tabular"
                              style={best.has(i) ? { color: toneColor("pos") } : undefined}
                            >
                              {v === null ? "n/a" : m.format(v)}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Panel>
          </Section>

          <Section>
            <Panel eyebrow="This quarter" title="NOI by Property">
              <div className="flex flex-col gap-3">
                {chosen
                  .slice()
                  .sort((a, b) => b.noi - a.noi)
                  .map((p) => (
                    <BrickBar
                      key={p.propertyId}
                      label={p.tradeName}
                      tone={occupancyBand(p.physicalOccupancy)}
                      fraction={Math.max(p.noi, 0) / maxNoi}
                      value={money(p.noi)}
                      cells={24}
                    />
                  ))}
              </div>
            </Panel>
          </Section>

          <Section>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Panel eyebrow="Over time" title="NOI">
                <TrendChart
                  xLabels={quarterLabels}
                  height={260}
                  formatY={(n) => money(n)}
                  series={chosen.map((p) => ({
                    label: p.tradeName,
                    color: colorOf.get(p.propertyId) as string,
                    values: p.noiSeries,
                    dots: true,
                  }))}
                />
              </Panel>
              <Panel eyebrow="Over time" title="Physical Occupancy">
                <TrendChart
                  xLabels={quarterLabels}
                  height={260}
                  formatY={(n) => percent(n)}
                  series={chosen.map((p) => ({
                    label: p.tradeName,
                    color: colorOf.get(p.propertyId) as string,
                    values: p.occSeries,
                    dots: true,
                  }))}
                />
              </Panel>
            </div>
            {quarterLabels.length < 2 && (
              <p className="mt-3 font-sans text-caption text-faint">
                Only one quarter is on file, so each trend shows a single point.
                Import another quarter to see movement build up here.
              </p>
            )}
          </Section>
        </>
      )}
    </motion.div>
  );
}
