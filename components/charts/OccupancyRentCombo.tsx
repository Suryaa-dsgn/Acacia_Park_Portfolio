"use client";
// components/charts/OccupancyRentCombo.tsx
// Dual-axis occupancy + rent-growth combo (design review, image 5). Grouped
// occupancy bars for two full years (right axis, %) plus two average-in-place-rent
// lines (left axis, $). Hovering a month shows a crosshair and a tooltip with all
// four values. Pure SVG, token colors, follows the TrendChart conventions.
import { useRef, useState } from "react";
import { money, percent } from "@/lib/format";

const PAD = { l: 52, r: 46, t: 14, b: 46 };

// Occupancy bar colors (two years) and rent line colors (two years).
const OCC_COLORS = ["var(--color-info)", "var(--color-neg)"];
const RENT_COLORS = ["var(--cat-6)", "var(--color-warn)"];

export function OccupancyRentCombo({
  months,
  years,
  occupancy,
  avgInPlaceRent,
  width = 560,
  height = 300,
}: {
  months: string[];
  years: [number, number];
  occupancy: [number[], number[]];
  avgInPlaceRent: [number[], number[]];
  width?: number;
  height?: number;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const n = months.length;
  const innerW = width - PAD.l - PAD.r;
  const innerH = height - PAD.t - PAD.b;
  const baseline = PAD.t + innerH;

  const occAll = [...occupancy[0], ...occupancy[1]];
  const rentAll = [...avgInPlaceRent[0], ...avgInPlaceRent[1]];
  const occMin = Math.max(0, Math.floor((Math.min(...occAll) - 0.01) * 50) / 50);
  const occMax = Math.min(1, Math.ceil((Math.max(...occAll) + 0.01) * 50) / 50);
  const rentPad = (Math.max(...rentAll) - Math.min(...rentAll)) * 0.25 || 20;
  const rentMin = Math.min(...rentAll) - rentPad;
  const rentMax = Math.max(...rentAll) + rentPad;

  const slot = innerW / n;
  const xCenter = (m: number) => PAD.l + slot * m + slot / 2;
  const yOcc = (v: number) => PAD.t + (1 - (v - occMin) / (occMax - occMin || 1)) * innerH;
  const yRent = (v: number) => PAD.t + (1 - (v - rentMin) / (rentMax - rentMin || 1)) * innerH;

  const barW = Math.min(9, slot * 0.28);
  const barGap = 2;

  const linePath = (vals: number[]) =>
    vals.map((v, i) => `${i === 0 ? "M" : "L"}${xCenter(i)},${yRent(v)}`).join(" ");

  const occTicks = Array.from({ length: 4 }, (_, i) => occMin + (i / 3) * (occMax - occMin));
  const rentTicks = Array.from({ length: 4 }, (_, i) => rentMin + (i / 3) * (rentMax - rentMin));

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const vbX = ((e.clientX - rect.left) / rect.width) * width;
    const idx = Math.floor((vbX - PAD.l) / slot);
    setHover(idx >= 0 && idx < n ? idx : null);
  }

  return (
    <div className="relative" style={{ lineHeight: 0 }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        height={height}
        role="img"
        aria-label={`Occupancy and rent growth, ${years[0]} and ${years[1]}`}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        style={{ display: "block", cursor: "crosshair" }}
      >
        {/* gridlines + right (occupancy) axis */}
        {occTicks.map((t, i) => (
          <g key={`o${i}`}>
            <line x1={PAD.l} x2={width - PAD.r} y1={yOcc(t)} y2={yOcc(t)} stroke="var(--color-border)" strokeWidth={1} />
            <text x={width - PAD.r + 6} y={yOcc(t) + 3} textAnchor="start" className="fill-muted font-mono" style={{ fontSize: 9 }}>
              {percent(t)}
            </text>
          </g>
        ))}
        {/* left (rent) axis */}
        {rentTicks.map((t, i) => (
          <text key={`r${i}`} x={PAD.l - 6} y={yRent(t) + 3} textAnchor="end" className="fill-muted font-mono" style={{ fontSize: 9 }}>
            {money(t)}
          </text>
        ))}

        {/* occupancy bars */}
        {months.map((_, m) => {
          const cx = xCenter(m);
          const x0 = cx - barW - barGap / 2;
          const x1 = cx + barGap / 2;
          return (
            <g key={m}>
              <rect x={x0} y={yOcc(occupancy[0][m])} width={barW} height={Math.max(0, baseline - yOcc(occupancy[0][m]))} fill={OCC_COLORS[0]} rx={1} />
              <rect x={x1} y={yOcc(occupancy[1][m])} width={barW} height={Math.max(0, baseline - yOcc(occupancy[1][m]))} fill={OCC_COLORS[1]} rx={1} />
              <text x={cx} y={baseline + 14} textAnchor="middle" className="fill-muted font-mono" style={{ fontSize: 9 }}>
                {months[m]}
              </text>
            </g>
          );
        })}

        {/* rent-growth lines */}
        <path d={linePath(avgInPlaceRent[0])} fill="none" stroke={RENT_COLORS[0]} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <path d={linePath(avgInPlaceRent[1])} fill="none" stroke={RENT_COLORS[1]} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {/* baseline */}
        <line x1={PAD.l} x2={width - PAD.r} y1={baseline} y2={baseline} stroke="var(--color-border-strong)" strokeWidth={1} />

        {/* hover crosshair */}
        {hover != null && (
          <line x1={xCenter(hover)} x2={xCenter(hover)} y1={PAD.t} y2={baseline} stroke="var(--color-border-strong)" strokeWidth={1} strokeDasharray="3 3" pointerEvents="none" />
        )}
      </svg>

      {/* legend */}
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5" style={{ lineHeight: 1.2 }}>
        <Chip color={OCC_COLORS[0]} label={`Occupancy ${years[0]}`} />
        <Chip color={OCC_COLORS[1]} label={`Occupancy ${years[1]}`} />
        <Chip color={RENT_COLORS[0]} label={`Rent ${years[0]}`} line />
        <Chip color={RENT_COLORS[1]} label={`Rent ${years[1]}`} line />
      </div>

      {/* tooltip */}
      {hover != null && (
        <div
          className="pointer-events-none absolute top-2 flex flex-col gap-1 rounded-sm border border-hairline bg-panel-raised px-3 py-2 shadow-md"
          style={hover / (n - 1) > 0.55 ? { right: `${((width - xCenter(hover)) / width) * 100 + 1}%` } : { left: `${(xCenter(hover) / width) * 100 + 1}%` }}
        >
          <span className="font-mono text-caption text-muted">{months[hover]}</span>
          <Row color={OCC_COLORS[0]} label={`Occ ${years[0]}`} value={percent(occupancy[0][hover])} />
          <Row color={OCC_COLORS[1]} label={`Occ ${years[1]}`} value={percent(occupancy[1][hover])} />
          <Row color={RENT_COLORS[0]} label={`Rent ${years[0]}`} value={money(avgInPlaceRent[0][hover])} />
          <Row color={RENT_COLORS[1]} label={`Rent ${years[1]}`} value={money(avgInPlaceRent[1][hover])} />
        </div>
      )}
    </div>
  );
}

function Chip({ color, label, line }: { color: string; label: string; line?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span aria-hidden className="shrink-0 rounded-xs" style={{ background: color, width: line ? 14 : 10, height: line ? 3 : 10 }} />
      <span className="font-mono text-caption text-muted">{label}</span>
    </span>
  );
}

function Row({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className="h-2.5 w-2.5 shrink-0 rounded-xs" style={{ background: color }} />
      <span className="font-mono text-caption text-muted">{label}</span>
      <span className="ml-1 font-mono text-caption tabular text-ink">{value}</span>
    </span>
  );
}
