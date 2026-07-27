// components/charts/TrendChart.tsx
// Line and area trend (DG 8.6, report spec section 8). Renders one or more
// monthly series as vector SVG. A series can split at a "modeledFrom" index,
// where the line becomes dashed and a soft area fill signals a projection
// rather than a fact. Null values break the line (a current-year series simply
// stops at the latest reported month). Supports a dashed horizontal target line,
// an optional vertical "today" marker, data-point dots, and an annotation of the
// latest actual point. Vector output stays crisp in print and PDF export.
import { toneColor, type Tone } from "@/lib/semantic";

export interface TrendSeries {
  label: string;
  values: (number | null)[];
  color: string; // CSS color or var()
  modeledFrom?: number; // index where the line becomes dashed + area (projection)
  dots?: boolean; // draw data-point dots on the actual segment
  annotateLatest?: string; // label for the latest actual point, e.g. "May: 93.5%"
}

const PAD = { l: 44, r: 16, t: 18, b: 26 };

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

  const yTicks = [yMin, (yMin + yMax) / 2, yMax];

  // Build a path from contiguous non-null runs within [start, end].
  function pathFor(values: (number | null)[], start: number, end: number) {
    let d = "";
    let pen = false;
    for (let i = start; i <= end && i < n; i++) {
      const v = values[i];
      if (v == null) {
        pen = false;
        continue;
      }
      d += `${pen ? "L" : "M"}${xFor(i)},${yFor(v)} `;
      pen = true;
    }
    return d.trim();
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      role="img"
      aria-label={`Trend chart: ${series.map((s) => s.label).join(", ")}`}
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
            y={yFor(t) + 3}
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
          y={height - PAD.b + 15}
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
        const modeledFrom = s.modeledFrom ?? n; // no modeled part by default
        const actualEnd = Math.min(modeledFrom, n - 1);
        const actualPath = pathFor(s.values, 0, actualEnd);
        const modeledPath =
          modeledFrom < n ? pathFor(s.values, modeledFrom - 1, n - 1) : "";

        // area under the modeled segment only (a projection, not a fact)
        let areaPath = "";
        if (modeledFrom < n) {
          const pts: string[] = [];
          for (let i = modeledFrom - 1; i < n; i++) {
            const v = s.values[i];
            if (v != null) pts.push(`${xFor(i)},${yFor(v)}`);
          }
          if (pts.length > 1) {
            const first = pts[0].split(",")[0];
            const last = pts[pts.length - 1].split(",")[0];
            areaPath = `M${first},${height - PAD.b} L${pts.join(" L")} L${last},${height - PAD.b} Z`;
          }
        }

        // latest actual point for dots + annotation
        let latestIdx = -1;
        for (let i = actualEnd; i >= 0; i--) {
          if (s.values[i] != null) {
            latestIdx = i;
            break;
          }
        }

        return (
          <g key={si}>
            {areaPath && (
              <path d={areaPath} fill={s.color} opacity={0.12} stroke="none" />
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
                    r={2.5}
                    fill={s.color}
                  />
                ) : null,
              )}
            {s.annotateLatest && latestIdx >= 0 && (
              <text
                x={xFor(latestIdx)}
                y={yFor(s.values[latestIdx] as number) - 10}
                textAnchor="middle"
                className="fill-ink font-sans"
                style={{ fontSize: 11, fontWeight: 500 }}
              >
                {s.annotateLatest}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
