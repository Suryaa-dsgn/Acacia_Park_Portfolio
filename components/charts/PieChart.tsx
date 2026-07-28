"use client";
// components/charts/PieChart.tsx
// Interactive donut for a part-to-whole breakdown (design review, request 4).
// Hovering a slice dims the others, pops the active slice slightly, and shows its
// label, amount, and share in the center hole. Colors are supplied by the caller
// (the categorical palette), so it matches the legend beside it. Pure SVG.
import { useState } from "react";
import { percent } from "@/lib/format";

export interface PieSegment {
  label: string;
  value: number;
  color: string;
}

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function arcPath(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  start: number,
  end: number,
): string {
  const largeArc = end - start > 180 ? 1 : 0;
  const o1 = polar(cx, cy, rOuter, end);
  const o2 = polar(cx, cy, rOuter, start);
  const i1 = polar(cx, cy, rInner, start);
  const i2 = polar(cx, cy, rInner, end);
  return [
    `M ${o1.x} ${o1.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 0 ${o2.x} ${o2.y}`,
    `L ${i1.x} ${i1.y}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 1 ${i2.x} ${i2.y}`,
    "Z",
  ].join(" ");
}

export function PieChart({
  segments,
  size = 208,
  formatValue = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`,
}: {
  segments: PieSegment[];
  size?: number;
  formatValue?: (n: number) => string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = size / 2 - 6;
  const rInner = rOuter * 0.62;
  const valFontSize = +(size * 0.088).toFixed(1);
  const lblFontSize = +(size * 0.063).toFixed(1);

  let cursor = 0;
  const arcs = segments.map((s, i) => {
    const start = (cursor / total) * 360;
    cursor += s.value;
    const end = (cursor / total) * 360;
    // A tiny pop outward for the active slice, along its mid-angle.
    const mid = (start + end) / 2;
    const off = active === i ? polar(0, 0, 5, mid) : { x: 0, y: 0 };
    return { i, s, d: arcPath(cx, cy, rOuter, rInner, start, end), dx: off.x, dy: off.y };
  });

  const activeSeg = active != null ? segments[active] : null;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      style={{ width: size, height: size, display: "block" }}
      role="img"
      aria-label={`Breakdown: ${segments.map((s) => `${s.label} ${percent(s.value / total)}`).join(", ")}`}
      onMouseLeave={() => setActive(null)}
    >
      {arcs.map((a) => (
        <path
          key={a.i}
          d={a.d}
          fill={a.s.color}
          transform={`translate(${a.dx} ${a.dy})`}
          opacity={active == null || active === a.i ? 1 : 0.4}
          stroke="var(--color-panel)"
          strokeWidth={1}
          style={{ transition: "opacity 120ms ease, transform 120ms ease", cursor: "pointer" }}
          onMouseEnter={() => setActive(a.i)}
        />
      ))}
      {/* center label */}
      <text x={cx} y={cy - 2} textAnchor="middle" className="fill-ink font-sans" style={{ fontSize: valFontSize, fontWeight: 600 }}>
        {activeSeg ? percent(activeSeg.value / total) : formatValue(total)}
      </text>
      <text x={cx} y={cy + lblFontSize + 2} textAnchor="middle" className="fill-muted font-mono" style={{ fontSize: lblFontSize, letterSpacing: "0.03em" }}>
        {activeSeg ? activeSeg.label : "Total OpEx"}
      </text>
    </svg>
  );
}
