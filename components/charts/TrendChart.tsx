"use client";
// components/charts/TrendChart.tsx
// Line and area trend (DG 8.6, report spec section 8). Renders one or more
// monthly series as vector SVG. A series can split at a "modeledFrom" index,
// where the line becomes dashed and a soft area fill signals a projection
// rather than a fact. Null values break the line (a current-year series simply
// stops at the latest reported month). Supports hover crosshair + tooltip,
// a dashed horizontal target line, an optional vertical "today" marker,
// data-point dots, and an annotation of the latest actual point.
import { useState, useRef } from "react";
import { toneColor, type Tone } from "@/lib/semantic";

export interface TrendSeries {
  label: string;
  values: (number | null)[];
  color: string; // CSS color or var()
  modeledFrom?: number; // index where the line becomes dashed + area (projection)
  dots?: boolean; // draw data-point dots on the actual segment
  fillActual?: boolean; // draw soft area fill under the actual segment
  annotateLatest?: string; // label for the latest actual point, e.g. "May: 93.5%"
}

const PAD = { l: 48, r: 80, t: 24, b: 30 };

export function TrendChart({
  series,
  xLabels,
  yDomain,
  target,
  todayIndex,
  width = 560,
  height = 300,
  formatY = (n) => `${(n * 100).toFixed(0)}%`,
}: {
  series: TrendSeries[];
  xLabels: string[];
  yDomain?: [number, number];
  target?: { value: number; label: string; tone?: Tone };
  todayIndex?: number;
  width?: number;
  height?: number;
  formatY?: (n: number) => string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const n = xLabels.length;
  const all = series.flatMap((s) =>
    s.values.filter((v): v is number => v != null),
  );
  const [yMin, yMax] =
    yDomain ??
    (() => {
      const min = Math.min(...all);
      const max = Math.max(...all);
      const pad = (max - min) * 0.15 || 0.01;
      return [min - pad, max + pad] as [number, number];
    })();

  const innerW = width - PAD.l - PAD.r;
  const innerH = height - PAD.t - PAD.b;
  const xFor = (i: number) => PAD.l + (n <= 1 ? 0 : (i / (n - 1)) * innerW);
  const yFor = (v: number) =>
    PAD.t + (1 - (v - yMin) / (yMax - yMin)) * innerH;

  // 5 evenly-spaced y-ticks across the domain
  const yTicks = Array.from({ length: 5 }, (_, i) => yMin + (i / 4) * (yMax - yMin));

  // Build a path from contiguous non-null runs within [start, end].
  function pathFor(values: (number | null)[], start: number, end: number) {
    let d = "";
    let pen = false;
    for (let i = start; i <= end && i < n; i++) {
      const v = values[i];
      if (v == null) { pen = false; continue; }
      d += `${pen ? "L" : "M"}${xFor(i)},${yFor(v)} `;
      pen = true;
    }
    return d.trim();
  }

  // Area path below a segment (used for modeled projections and optional actual fill)
  function areaPathFor(values: (number | null)[], start: number, end: number) {
    const pts: string[] = [];
    for (let i = start; i <= end && i < n; i++) {
      const v = values[i];
      if (v != null) pts.push(`${xFor(i)},${yFor(v)}`);
    }
    if (pts.length < 2) return "";
    const firstX = pts[0].split(",")[0];
    const lastX = pts[pts.length - 1].split(",")[0];
    const bottom = height - PAD.b;
    return `M${firstX},${bottom} L${pts.join(" L")} L${lastX},${bottom} Z`;
  }

  // Mouse interaction: map clientX → nearest series index
  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg || n <= 1) return;
    const rect = svg.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    // scale screen px to viewBox px
    const vbX = (mouseX / rect.width) * width;
    const rawIdx = Math.round(((vbX - PAD.l) / innerW) * (n - 1));
    setHoverIdx(Math.max(0, Math.min(n - 1, rawIdx)));
  }

  // Tooltip position (screen-space %) — flip to left side when past 55% of chart
  const tooltipOnLeft = hoverIdx != null && hoverIdx / (n - 1) > 0.55;

  return (
    <div className="relative" style={{ lineHeight: 0 }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        role="img"
        aria-label={`Trend chart: ${series.map((s) => s.label).join(", ")}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIdx(null)}
        style={{ cursor: "crosshair", display: "block" }}
      >
        {/* gridlines + y ticks */}
        {yTicks.map((t, i) => (
          <g key={`y${i}`}>
            <line
              x1={PAD.l}
              x2={width - PAD.r}
              y1={yFor(t)}
              y2={yFor(t)}
              stroke="var(--color-border)"
              strokeWidth={1}
            />
            <text
              x={PAD.l - 8}
              y={yFor(t) + 4}
              textAnchor="end"
              className="fill-muted font-mono"
              style={{ fontSize: 10, letterSpacing: "0.04em" }}
            >
              {formatY(t)}
            </text>
          </g>
        ))}

        {/* x labels */}
        {xLabels.map((lab, i) => (
          <text
            key={`x${i}`}
            x={xFor(i)}
            y={height - PAD.b + 18}
            textAnchor="middle"
            className="fill-muted font-mono"
            style={{ fontSize: 10, letterSpacing: "0.04em" }}
          >
            {lab}
          </text>
        ))}

        {/* today marker */}
        {todayIndex != null && (
          <line
            x1={xFor(todayIndex)}
            x2={xFor(todayIndex)}
            y1={PAD.t}
            y2={height - PAD.b}
            stroke="var(--color-border-strong)"
            strokeWidth={1}
            strokeDasharray="2 3"
          />
        )}

        {/* target line */}
        {target && (
          <g>
            <line
              x1={PAD.l}
              x2={width - PAD.r}
              y1={yFor(target.value)}
              y2={yFor(target.value)}
              stroke={toneColor(target.tone ?? "warn")}
              strokeWidth={1}
              strokeDasharray="4 3"
            />
            <text
              x={width - PAD.r}
              y={yFor(target.value) - 4}
              textAnchor="end"
              className="font-mono"
              style={{
                fontSize: 10,
                letterSpacing: "0.04em",
                fill: toneColor(target.tone ?? "warn"),
              }}
            >
              {target.label}
            </text>
          </g>
        )}

        {/* series */}
        {series.map((s, si) => {
          const modeledFrom = s.modeledFrom ?? n;
          const actualEnd = Math.min(modeledFrom, n - 1);
          const actualPath = pathFor(s.values, 0, actualEnd);
          const modeledPath =
            modeledFrom < n ? pathFor(s.values, modeledFrom - 1, n - 1) : "";

          // area under modeled segment (projection)
          const modeledArea =
            modeledFrom < n ? areaPathFor(s.values, modeledFrom - 1, n - 1) : "";

          // optional soft area fill under actual segment
          const actualArea =
            s.fillActual ? areaPathFor(s.values, 0, actualEnd) : "";

          // latest actual point index (for annotation)
          let latestIdx = -1;
          for (let i = actualEnd; i >= 0; i--) {
            if (s.values[i] != null) { latestIdx = i; break; }
          }

          // dynamic text-anchor for annotation — avoid right-edge cutoff
          const anchor =
            latestIdx >= n - 2 ? "end" : latestIdx <= 1 ? "start" : "middle";
          const annotX =
            anchor === "end"
              ? xFor(latestIdx) - 2
              : anchor === "start"
              ? xFor(latestIdx) + 2
              : xFor(latestIdx);

          return (
            <g key={si}>
              {actualArea && (
                <path d={actualArea} fill={s.color} opacity={0.10} stroke="none" />
              )}
              {modeledArea && (
                <path d={modeledArea} fill={s.color} opacity={0.12} stroke="none" />
              )}
              {actualPath && (
                <path
                  d={actualPath}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {modeledPath && (
                <path
                  d={modeledPath}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  strokeLinecap="round"
                />
              )}
              {s.dots &&
                s.values.map((v, i) =>
                  v != null && i <= actualEnd ? (
                    <circle
                      key={i}
                      cx={xFor(i)}
                      cy={yFor(v)}
                      r={3.5}
                      fill={s.color}
                    />
                  ) : null,
                )}
              {s.annotateLatest && latestIdx >= 0 && (
                <g>
                  {/* background pill behind annotation */}
                  <rect
                    x={annotX - (anchor === "middle" ? 28 : anchor === "end" ? 56 : 0)}
                    y={yFor(s.values[latestIdx] as number) - 26}
                    width={58}
                    height={16}
                    rx={3}
                    fill="var(--color-panel)"
                    stroke="var(--color-border)"
                    strokeWidth={1}
                  />
                  <text
                    x={annotX}
                    y={yFor(s.values[latestIdx] as number) - 14}
                    textAnchor={anchor}
                    className="fill-ink font-mono"
                    style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.03em" }}
                  >
                    {s.annotateLatest}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* hover crosshair */}
        {hoverIdx != null && (
          <line
            x1={xFor(hoverIdx)}
            x2={xFor(hoverIdx)}
            y1={PAD.t}
            y2={height - PAD.b}
            stroke="var(--color-border-strong)"
            strokeWidth={1}
            strokeDasharray="3 3"
            pointerEvents="none"
          />
        )}

        {/* hover highlight dots — painted on top of everything */}
        {hoverIdx != null &&
          series.map((s, si) => {
            const v = s.values[hoverIdx];
            if (v == null) return null;
            return (
              <circle
                key={`hover-${si}`}
                cx={xFor(hoverIdx)}
                cy={yFor(v)}
                r={5.5}
                fill={s.color}
                stroke="var(--color-panel)"
                strokeWidth={2}
                pointerEvents="none"
              />
            );
          })}
      </svg>

      {/* Tooltip div — absolutely positioned over wrapper */}
      {hoverIdx != null && (
        <div
          className="pointer-events-none absolute top-6 flex flex-col gap-1.5 rounded-sm border border-hairline bg-panel-raised px-3 py-2 shadow-md"
          style={{
            ...(tooltipOnLeft
              ? { right: `${((width - xFor(hoverIdx)) / width) * 100 + 1}%` }
              : { left: `${(xFor(hoverIdx) / width) * 100 + 1}%` }),
          }}
        >
          <span className="font-mono text-caption text-muted">
            {xLabels[hoverIdx]}
          </span>
          {series.map((s, si) => {
            const v = s.values[hoverIdx];
            return (
              <span key={si} className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-xs"
                  style={{ background: s.color }}
                />
                <span className="font-mono text-caption text-muted">{s.label}</span>
                <span className="ml-1 font-mono text-caption tabular text-ink">
                  {v != null ? formatY(v) : "--"}
                </span>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
