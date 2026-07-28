// components/charts/GroupedBarChart.tsx
// Vertical grouped bar chart (design review, image 3). One group per category
// with a prior-year and current-year bar, value labels above each bar, gridlines,
// and a two-item legend. Pure SVG, follows the TrendChart conventions (viewBox,
// token colors, tabular mono labels). Static: no hover needed.
import { LegendChip } from "@/components/primitives/LegendChip";

export interface BarGroup {
  label: string;
  prior: number;
  current: number;
}

const PAD = { l: 8, r: 8, t: 22, b: 40 };

// Compact money for the on-bar labels so long figures never collide: $1.77M, $842K.
function compact(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}$${Math.round(abs / 1_000)}K`;
  return `${sign}$${Math.round(abs)}`;
}

// A "nice" axis max a little above the tallest bar.
function niceMax(v: number): number {
  if (v <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow * 1.1;
}

export function GroupedBarChart({
  groups,
  priorLabel,
  currentLabel,
  priorColor = "var(--color-info)",
  currentColor = "var(--color-pos)",
  width = 460,
  height = 300,
}: {
  groups: BarGroup[];
  priorLabel: string;
  currentLabel: string;
  priorColor?: string;
  currentColor?: string;
  width?: number;
  height?: number;
}) {
  const innerW = width - PAD.l - PAD.r;
  const innerH = height - PAD.t - PAD.b;
  const yMax = niceMax(Math.max(1, ...groups.flatMap((g) => [g.prior, g.current])));
  const yFor = (v: number) => PAD.t + (1 - v / yMax) * innerH;
  const baseline = PAD.t + innerH;

  const n = groups.length;
  const slot = innerW / n;
  const barW = Math.min(46, slot * 0.3);
  const gap = barW * 0.32;

  const ticks = Array.from({ length: 4 }, (_, i) => (i / 3) * yMax);

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        height={height}
        role="img"
        aria-label={`Year over year: ${groups.map((g) => g.label).join(", ")}`}
        style={{ display: "block" }}
      >
        {/* gridlines */}
        {ticks.map((t, i) => (
          <line
            key={i}
            x1={PAD.l}
            x2={width - PAD.r}
            y1={yFor(t)}
            y2={yFor(t)}
            stroke="var(--color-border)"
            strokeWidth={1}
          />
        ))}

        {groups.map((g, gi) => {
          const cx = PAD.l + slot * gi + slot / 2;
          const priorX = cx - gap / 2 - barW;
          const currX = cx + gap / 2;
          return (
            <g key={g.label}>
              <rect x={priorX} y={yFor(Math.max(0, g.prior))} width={barW} height={Math.abs(baseline - yFor(Math.max(0, g.prior)))} fill={priorColor} rx={1.5} />
              <rect x={currX} y={yFor(Math.max(0, g.current))} width={barW} height={Math.abs(baseline - yFor(Math.max(0, g.current)))} fill={currentColor} rx={1.5} />
              <text x={priorX + barW / 2} y={yFor(Math.max(0, g.prior)) - 5} textAnchor="middle" className="fill-muted font-mono" style={{ fontSize: 9.5 }}>
                {compact(g.prior)}
              </text>
              <text x={currX + barW / 2} y={yFor(Math.max(0, g.current)) - 5} textAnchor="middle" className="fill-ink font-mono" style={{ fontSize: 9.5 }}>
                {compact(g.current)}
              </text>
              <text x={cx} y={baseline + 16} textAnchor="middle" className="fill-muted font-mono" style={{ fontSize: 10, letterSpacing: "0.02em" }}>
                {g.label}
              </text>
            </g>
          );
        })}

        {/* baseline */}
        <line x1={PAD.l} x2={width - PAD.r} y1={baseline} y2={baseline} stroke="var(--color-border-strong)" strokeWidth={1} />
      </svg>

      <div className="mt-2 flex flex-wrap gap-4">
        <LegendChip color={priorColor} label={priorLabel} />
        <LegendChip color={currentColor} label={currentLabel} />
      </div>
    </div>
  );
}
