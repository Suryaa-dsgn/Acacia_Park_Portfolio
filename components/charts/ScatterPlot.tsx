"use client";
// components/charts/ScatterPlot.tsx
// Occupancy vs NOI-per-unit scatter (DG 8.3). One dot per property, colored by
// occupancy band. Vector SVG so it prints and exports crisply. Dots grow and
// show a tooltip on hover; linkable dots get a ring on hover and navigate on
// click, non-linkable dots do not (honest affordance, DG 8.3). Axis labels are
// mono, muted, uppercase.
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toneColor, type Tone } from "@/lib/semantic";

export interface ScatterPoint {
  x: number;
  y: number;
  tone: Tone;
  label: string;
  xDisplay?: string;
  yDisplay?: string;
  href?: string;
}

const PAD = { l: 48, r: 16, t: 16, b: 32 };

function niceDomain(values: number[]): [number, number] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) return [min - 1, max + 1];
  const pad = (max - min) * 0.08;
  return [min - pad, max + pad];
}

export function ScatterPlot({
  points,
  width = 520,
  height = 320,
  xLabel,
  yLabel,
  formatX = (n) => String(Math.round(n)),
  formatY = (n) => `${(n * 100).toFixed(0)}%`,
}: {
  points: ScatterPoint[];
  width?: number;
  height?: number;
  xLabel: string;
  yLabel: string;
  formatX?: (n: number) => string;
  formatY?: (n: number) => string;
}) {
  const router = useRouter();
  const [hover, setHover] = useState<number | null>(null);

  const [xMin, xMax] = niceDomain(points.map((p) => p.x));
  const [yMin, yMax] = niceDomain(points.map((p) => p.y));
  const innerW = width - PAD.l - PAD.r;
  const innerH = height - PAD.t - PAD.b;
  const xFor = (x: number) => PAD.l + ((x - xMin) / (xMax - xMin)) * innerW;
  const yFor = (y: number) => PAD.t + (1 - (y - yMin) / (yMax - yMin)) * innerH;

  const xTicks = [xMin, (xMin + xMax) / 2, xMax];
  const yTicks = [yMin, (yMin + yMax) / 2, yMax];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      role="img"
      aria-label={`${yLabel} versus ${xLabel}, ${points.length} points`}
    >
      {/* gridlines */}
      {yTicks.map((t, i) => (
        <line
          key={`gy${i}`}
          x1={PAD.l}
          x2={width - PAD.r}
          y1={yFor(t)}
          y2={yFor(t)}
          stroke="var(--color-border)"
          strokeWidth={1}
        />
      ))}
      {/* y axis ticks */}
      {yTicks.map((t, i) => (
        <text
          key={`ty${i}`}
          x={PAD.l - 8}
          y={yFor(t) + 3}
          textAnchor="end"
          className="fill-muted font-mono"
          style={{ fontSize: 10, letterSpacing: "0.04em" }}
        >
          {formatY(t)}
        </text>
      ))}
      {/* x axis ticks */}
      {xTicks.map((t, i) => (
        <text
          key={`tx${i}`}
          x={xFor(t)}
          y={height - PAD.b + 16}
          textAnchor="middle"
          className="fill-muted font-mono"
          style={{ fontSize: 10, letterSpacing: "0.04em" }}
        >
          {formatX(t)}
        </text>
      ))}
      {/* axis labels */}
      <text
        x={PAD.l}
        y={12}
        className="fill-muted font-mono uppercase"
        style={{ fontSize: 10, letterSpacing: "0.1em" }}
      >
        {yLabel}
      </text>
      <text
        x={width - PAD.r}
        y={height - 4}
        textAnchor="end"
        className="fill-muted font-mono uppercase"
        style={{ fontSize: 10, letterSpacing: "0.1em" }}
      >
        {xLabel}
      </text>

      {/* points */}
      {points.map((p, i) => {
        const cx = xFor(p.x);
        const cy = yFor(p.y);
        const isHover = hover === i;
        const linkable = Boolean(p.href);
        return (
          <g
            key={i}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            onClick={() => p.href && router.push(p.href)}
            style={{ cursor: linkable ? "pointer" : "default" }}
          >
            {isHover && linkable && (
              <circle
                cx={cx}
                cy={cy}
                r={9}
                fill="none"
                stroke={toneColor(p.tone)}
                strokeWidth={1.5}
                opacity={0.6}
              />
            )}
            <circle
              cx={cx}
              cy={cy}
              r={isHover ? 6 : 4}
              fill={toneColor(p.tone)}
            />
            {isHover && (
              <g pointerEvents="none">
                <text
                  x={cx}
                  y={cy - 12}
                  textAnchor="middle"
                  className="fill-ink font-sans"
                  style={{ fontSize: 11, fontWeight: 500 }}
                >
                  {p.label}
                  {p.yDisplay ? ` ${p.yDisplay}` : ""}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}
