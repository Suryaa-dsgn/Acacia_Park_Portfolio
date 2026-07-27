// components/primitives/KpiCard.tsx
// Top-line metric card (DG 9.2). Mono uppercase caption, a large tabular sans
// value in the serif-white ink, and an optional sub-caption that can carry a
// semantic tone when it reports health (a YoY delta, a margin). Compact mode
// tightens padding for dense metric grids (rent roll, leasing tiles).
import { cn } from "@/lib/cn";
import { toneColor, type Tone } from "@/lib/semantic";

export function KpiCard({
  caption,
  value,
  yoy,
  sub,
  subTone,
  compact,
  className,
}: {
  caption: React.ReactNode;
  value: React.ReactNode;
  // A colored YoY line (arrow + signed percent), tone from favorability (DM 5).
  yoy?: { label: React.ReactNode; tone: Tone };
  sub?: React.ReactNode;
  subTone?: Tone;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "kpi rounded-sm border border-hairline bg-panel",
        compact ? "p-4" : "p-5 md:p-6",
        className,
      )}
    >
      <p className="font-mono text-label uppercase text-muted">{caption}</p>
      <p
        className={cn(
          "mt-2 font-sans font-semibold tabular text-text-serif",
          compact ? "text-title" : "text-kpi-value",
        )}
      >
        {value}
      </p>
      {yoy != null && (
        <p
          className="mt-1.5 font-mono text-caption tabular"
          style={{ color: toneColor(yoy.tone) }}
        >
          {yoy.label}
        </p>
      )}
      {sub != null && (
        <p
          className="mt-1 font-mono text-caption tabular"
          style={{ color: subTone ? toneColor(subTone) : "var(--color-text-faint)" }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}
