"use client";
// components/report/SignalView.tsx
// Portfolio Signal (legacy "Signal" surface). An ILLUSTRATIVE forecast page:
// skyline of NOI-per-unit towers, a predictive occupancy band with a horizon and
// shock control, a probability ring, a per-unit occupancy waffle, and an asset
// x-ray. All modeling is labeled illustrative (see lib/forecast). Built from the
// existing primitives: Panel, Brick, Waffle, BrickBar, TrendChart, MetricTile.
import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { revealContainer, revealItem, revealItemReduced } from "@/lib/motion";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { Panel } from "@/components/primitives/Panel";
import { Brick } from "@/components/primitives/Brick";
import { BrickBar } from "@/components/primitives/BrickBar";
import { LegendChip } from "@/components/primitives/LegendChip";
import { SegmentedToggle } from "@/components/primitives/SegmentedToggle";
import { MetricTile } from "@/components/report/MetricTile";
import { TrendChart } from "@/components/charts/TrendChart";
import {
  forecastOccupancy,
  probabilityAtLeast,
  modeledNoi,
  type OccForecast,
} from "@/lib/forecast";
import { money, percent, count, delta, signedPct } from "@/lib/format";
import { occupancyBand, toneColor } from "@/lib/semantic";

export interface SignalProperty {
  propertyId: string;
  tradeName: string;
  cityState: string;
  units: number;
  noi: number;
  totalIncome: number;
  opex: number;
  physicalOccupancy: number;
  economicOccupancy: number;
  occupiedUnits: number;
  vacantUnits: number;
  totalInPlaceRent: number;
  totalMarketRent: number;
  occupancyCurrent: (number | null)[];
  noticesToVacate: number | null;
  unitsRented: number | null;
  renewals: number | null;
  netAbsorption: number | null;
}

const TARGET = 0.955; // illustrative occupancy target
const SKYLINE_MAX_BRICKS = 12;

type Horizon = "3" | "6" | "12";
type SkylineSort = "noi" | "occ" | "name";

interface Derived {
  p: SignalProperty;
  forecast: OccForecast;
  prob: number;
  modeled: number; // modeled NOI at expected occupancy
  noiPerUnit: number;
}

// A quiet ring showing a single probability. Inline SVG (local to this view).
function ProbabilityRing({ value }: { value: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.max(0, Math.min(1, value)));
  return (
    <svg viewBox="0 0 80 80" className="h-20 w-20" role="img" aria-label={`${percent(value)} probability`}>
      <circle cx={40} cy={40} r={r} fill="none" stroke="var(--color-border)" strokeWidth={7} />
      <circle
        cx={40}
        cy={40}
        r={r}
        fill="none"
        stroke={toneColor("pos")}
        strokeWidth={7}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform="rotate(-90 40 40)"
      />
    </svg>
  );
}

export function SignalView({
  quarterLabel,
  monthLabels,
  properties,
}: {
  quarterLabel: string;
  monthLabels: string[];
  properties: SignalProperty[];
}) {
  const reduced = useReducedMotion();
  const item = reduced ? revealItemReduced : revealItem;

  const [horizon, setHorizon] = useState<Horizon>("3");
  const [shockPts, setShockPts] = useState(0); // occupancy points, -5..5
  const [skylineSort, setSkylineSort] = useState<SkylineSort>("noi");
  const [selectedId, setSelectedId] = useState(properties[0]?.propertyId ?? "");

  const horizonMonths = Number(horizon);
  const shockFraction = shockPts / 100;

  const derived: Derived[] = useMemo(
    () =>
      properties.map((p) => {
        const forecast = forecastOccupancy(p.occupancyCurrent, horizonMonths, shockFraction);
        return {
          p,
          forecast,
          prob: probabilityAtLeast(forecast, TARGET),
          modeled: modeledNoi(p.totalIncome, p.opex, p.physicalOccupancy, forecast.expected),
          noiPerUnit: p.units > 0 ? p.noi / p.units : 0,
        };
      }),
    [properties, horizonMonths, shockFraction],
  );

  // Portfolio roll-ups.
  const totalUnits = properties.reduce((a, p) => a + p.units, 0);
  const totalNoi = properties.reduce((a, p) => a + p.noi, 0);
  const totalIncome = properties.reduce((a, p) => a + p.totalIncome, 0);
  const occupiedUnits = properties.reduce((a, p) => a + p.occupiedUnits, 0);
  const inPlace = properties.reduce((a, p) => a + p.totalInPlaceRent, 0);
  const market = properties.reduce((a, p) => a + p.totalMarketRent, 0);
  const netAbsorption = properties.reduce((a, p) => a + (p.netAbsorption ?? 0), 0);
  const physicalOcc = totalUnits > 0 ? occupiedUnits / totalUnits : 0;
  const rentCapture = market > 0 ? inPlace / market : 0;

  // Units-weighted portfolio forecast; band combined as independent variances.
  const wExpected =
    totalUnits > 0
      ? derived.reduce((a, d) => a + d.forecast.expected * d.p.units, 0) / totalUnits
      : 0;
  const wBand = Math.sqrt(
    derived.reduce((a, d) => {
      const w = totalUnits > 0 ? d.p.units / totalUnits : 0;
      return a + (w * d.forecast.band) ** 2;
    }, 0),
  );
  const portfolioExpected = wExpected;
  const portfolioDownside = Math.max(0, wExpected - wBand);
  const portfolioUpside = Math.min(1, wExpected + wBand);
  const portfolioProb =
    wBand <= 0
      ? portfolioExpected >= TARGET
        ? 1
        : 0
      : probabilityAtLeast({ ...derived[0]?.forecast, expected: portfolioExpected, band: wBand } as OccForecast, TARGET);
  const modeledPortfolioNoi = derived.reduce((a, d) => a + d.modeled, 0);

  // Predictive range domain across all properties and the target.
  const lows = derived.map((d) => d.forecast.downside).concat(TARGET, portfolioDownside);
  const highs = derived.map((d) => d.forecast.upside).concat(TARGET, portfolioUpside);
  const dMin = Math.max(0, Math.min(...lows) - 0.01);
  const dMax = Math.min(1, Math.max(...highs) + 0.01);
  const toPct = (v: number) => ((v - dMin) / (dMax - dMin || 1)) * 100;

  const skyline = useMemo(() => {
    const rows = derived.slice();
    rows.sort((a, b) => {
      if (skylineSort === "name") return a.p.tradeName.localeCompare(b.p.tradeName);
      if (skylineSort === "occ") return b.p.physicalOccupancy - a.p.physicalOccupancy;
      return b.noiPerUnit - a.noiPerUnit;
    });
    return rows;
  }, [derived, skylineSort]);
  const maxPerUnit = Math.max(1, ...derived.map((d) => d.noiPerUnit));

  const selected = derived.find((d) => d.p.propertyId === selectedId) ?? derived[0];

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
      {/* Hero + skyline */}
      <Section>
        <Panel>
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-md">
              <Eyebrow>{`${quarterLabel} Portfolio Signal · ${properties.length} properties`}</Eyebrow>
              <h1 className="mt-2 font-serif text-display-lg font-semibold text-text-serif">
                Your assets, read as a skyline.
              </h1>
              <p className="mt-3 max-w-prose font-sans text-body-lg text-muted">
                Tower height shows NOI per unit; brick color shows occupancy band.
                The forecast below is an illustrative model, not a statistical
                prediction.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-x-8 gap-y-5">
                <MetricTile label="Portfolio NOI" value={money(totalNoi)} />
                <MetricTile label="Physical Occupancy" value={percent(physicalOcc)} />
                <MetricTile label="Rent Capture" value={percent(rentCapture)} />
                <MetricTile label="Net Absorption" value={delta(netAbsorption)} tone={netAbsorption >= 0 ? "pos" : "neg"} />
              </div>
            </div>

            <div>
              <div className="mb-3 flex justify-end">
                <SegmentedToggle<SkylineSort>
                  ariaLabel="Sort skyline"
                  value={skylineSort}
                  onChange={setSkylineSort}
                  segments={[
                    { value: "noi", label: "NOI/Unit" },
                    { value: "occ", label: "Occupancy" },
                    { value: "name", label: "Name" },
                  ]}
                />
              </div>
              <div className="flex items-end gap-4 overflow-x-auto pb-1">
                {skyline.map((d) => {
                  const bricks = Math.max(1, Math.round((d.noiPerUnit / maxPerUnit) * SKYLINE_MAX_BRICKS));
                  const tone = occupancyBand(d.p.physicalOccupancy);
                  return (
                    <div key={d.p.propertyId} className="flex shrink-0 flex-col items-center gap-2">
                      <div className="flex flex-col-reverse gap-1">
                        {Array.from({ length: bricks }).map((_, i) => (
                          <Brick key={i} color={toneColor(tone)} size={16} />
                        ))}
                      </div>
                      <span className="max-w-[64px] truncate font-mono text-caption text-muted" title={d.p.tradeName}>
                        {d.p.tradeName}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Panel>
      </Section>

      {/* Predictive occupancy */}
      <Section>
        <Panel
          eyebrow="Predictive occupancy"
          title={`The portfolio is modeled at ${percent(portfolioExpected)}`}
          description="Illustrative model using the reported monthly trend, volatility, and mean reversion. Not a statistical forecast."
          action={
            <SegmentedToggle<Horizon>
              ariaLabel="Forecast horizon"
              value={horizon}
              onChange={setHorizon}
              segments={[
                { value: "3", label: "3M" },
                { value: "6", label: "6M" },
                { value: "12", label: "12M" },
              ]}
            />
          }
        >
          <div className="flex flex-col gap-3">
            {derived.map((d) => (
              <div key={d.p.propertyId} className="flex items-center gap-3">
                <span className="w-40 shrink-0 truncate font-sans text-body text-ink" title={d.p.tradeName}>
                  {d.p.tradeName}
                </span>
                <div className="relative h-6 flex-1 rounded-sm bg-panel-raised">
                  {/* target line */}
                  <span
                    aria-hidden
                    className="absolute top-0 h-full border-l border-dashed"
                    style={{ left: `${toPct(TARGET)}%`, borderColor: toneColor("warn") }}
                  />
                  {/* band */}
                  <span
                    aria-hidden
                    className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-pill"
                    style={{
                      left: `${toPct(d.forecast.downside)}%`,
                      width: `${Math.max(0, toPct(d.forecast.upside) - toPct(d.forecast.downside))}%`,
                      background: "var(--color-accent-soft)",
                    }}
                  />
                  {/* expected marker */}
                  <span
                    aria-hidden
                    className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{ left: `${toPct(d.forecast.expected)}%`, background: toneColor("accent") }}
                  />
                </div>
                <span className="w-16 shrink-0 text-right font-mono text-caption tabular text-muted">
                  {percent(d.forecast.expected)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-3 gap-x-6 border-t border-hairline pt-5">
            <MetricTile label="Downside" value={percent(portfolioDownside)} tone="neg" />
            <MetricTile label="Expected" value={percent(portfolioExpected)} tone="pos" />
            <MetricTile label="Upside" value={percent(portfolioUpside)} tone="pos" />
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between font-mono text-caption uppercase tracking-[0.08em] text-muted">
              <span>Occupancy shock</span>
              <span className="tabular text-ink">{shockPts > 0 ? "+" : ""}{shockPts.toFixed(1)} pts</span>
            </div>
            <input
              type="range"
              min={-5}
              max={5}
              step={0.5}
              value={shockPts}
              onChange={(e) => setShockPts(Number(e.target.value))}
              aria-label="Occupancy shock in points"
              className="w-full accent-accent"
            />
            <p className="mt-2 font-sans text-caption text-faint">
              Applies a portfolio-wide occupancy swing to modeled revenue, holding
              operating expenses fixed. Modeled NOI this quarter: {money(modeledPortfolioNoi)}.
            </p>
          </div>
        </Panel>
      </Section>

      {/* Probability signal */}
      <Section>
        <Panel eyebrow="Probability signal" title={`Chance of reaching ${percent(TARGET)} occupancy`}>
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <ProbabilityRing value={portfolioProb} />
              <div>
                <div className="font-serif text-display font-semibold text-text-serif">{percent(portfolioProb)}</div>
                <div className="font-sans text-caption text-muted">portfolio, {horizon}M horizon</div>
              </div>
            </div>
            <div className="flex flex-col gap-2.5">
              {derived
                .slice()
                .sort((a, b) => b.prob - a.prob)
                .map((d) => (
                  <BrickBar
                    key={d.p.propertyId}
                    label={d.p.tradeName}
                    tone={d.prob >= 0.5 ? "pos" : d.prob >= 0.2 ? "warn" : "neg"}
                    fraction={d.prob}
                    value={percent(d.prob)}
                    cells={18}
                  />
                ))}
            </div>
          </div>
        </Panel>
      </Section>

      {/* Brick-by-brick occupancy + asset x-ray */}
      <Section>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Panel eyebrow="Brick by brick" title="Every brick is one unit">
            <div className="mb-4 flex flex-wrap gap-2">
              {derived.map((d) => {
                const active = d.p.propertyId === selected?.p.propertyId;
                return (
                  <button
                    key={d.p.propertyId}
                    onClick={() => setSelectedId(d.p.propertyId)}
                    aria-pressed={active}
                    className={
                      "rounded-sm border px-2.5 py-1 font-mono text-caption uppercase tracking-[0.08em] transition-colors " +
                      (active
                        ? "border-hairline-strong text-text-serif"
                        : "border-hairline text-muted hover:text-text-serif")
                    }
                  >
                    {d.p.tradeName}
                  </button>
                );
              })}
            </div>
            {selected && <UnitWaffle p={selected.p} />}
            <div className="mt-4 flex flex-wrap gap-4">
              <LegendChip color={toneColor("pos")} label="Occupied" />
              <LegendChip color={toneColor("warn")} label="On notice" />
              <LegendChip color={toneColor("neg")} label="Vacant" />
            </div>
          </Panel>

          <Panel eyebrow="Asset x-ray" title={selected?.p.tradeName ?? "Property"}>
            {selected && (
              <>
                <p className="font-sans text-caption text-muted">{selected.p.cityState} · {count(selected.p.units)} units</p>
                <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-5">
                  <MetricTile label="NOI / Unit" value={money(selected.noiPerUnit)} />
                  <MetricTile
                    label="Rent Capture"
                    value={percent(selected.p.totalMarketRent > 0 ? selected.p.totalInPlaceRent / selected.p.totalMarketRent : 0)}
                  />
                  <MetricTile
                    label="Net Absorption"
                    value={selected.p.netAbsorption == null ? "n/a" : delta(selected.p.netAbsorption)}
                    tone={selected.p.netAbsorption != null && selected.p.netAbsorption >= 0 ? "pos" : "neg"}
                  />
                  <MetricTile label="Renewals" value={selected.p.renewals == null ? "n/a" : count(selected.p.renewals)} />
                </div>
                <div className="mt-6">
                  <AssetTrend p={selected.p} forecast={selected.forecast} monthLabels={monthLabels} />
                </div>
                <p className="mt-2 font-sans text-caption text-faint">
                  Solid is reported occupancy; dashed is the illustrative model to the
                  {" "}{horizon}M horizon. Dotted line is the {percent(TARGET)} target.
                </p>
              </>
            )}
          </Panel>
        </div>
      </Section>
    </motion.div>
  );
}

// One brick per unit, colored by status derived from the reported counts.
function UnitWaffle({ p }: { p: SignalProperty }) {
  const notice = Math.min(p.noticesToVacate ?? 0, p.occupiedUnits);
  const occupied = p.occupiedUnits - notice;
  const vacant = p.vacantUnits;
  const cells: string[] = [
    ...Array(Math.max(0, occupied)).fill(toneColor("pos")),
    ...Array(Math.max(0, notice)).fill(toneColor("warn")),
    ...Array(Math.max(0, vacant)).fill(toneColor("neg")),
  ];
  return (
    <div>
      <div className="mb-2 font-mono text-caption text-muted">
        {p.tradeName} · {percent(p.physicalOccupancy)} occupied
      </div>
      <div className="grid w-max gap-[3px]" style={{ gridTemplateColumns: "repeat(24, 10px)" }} role="img" aria-label={`${count(occupied)} occupied, ${count(notice)} on notice, ${count(vacant)} vacant`}>
        {cells.map((color, i) => (
          <span key={i} className="rounded-xs" style={{ width: 10, height: 10, background: color }} />
        ))}
      </div>
    </div>
  );
}

// Occupancy trend: reported months solid, modeled months dashed, target line.
function AssetTrend({
  p,
  forecast,
  monthLabels,
}: {
  p: SignalProperty;
  forecast: OccForecast;
  monthLabels: string[];
}) {
  const values: (number | null)[] = p.occupancyCurrent.map((v, i) =>
    i <= forecast.latestIdx ? v : forecast.modeled[i],
  );
  return (
    <TrendChart
      xLabels={monthLabels}
      height={240}
      formatY={(n) => `${(n * 100).toFixed(1)}%`}
      target={{ value: TARGET, label: `${percent(TARGET)} target`, tone: "warn" }}
      series={[
        {
          label: String(p.tradeName),
          color: toneColor("pos"),
          values,
          dots: true,
          fillActual: true,
          modeledFrom: forecast.latestIdx + 1,
        },
      ]}
    />
  );
}
