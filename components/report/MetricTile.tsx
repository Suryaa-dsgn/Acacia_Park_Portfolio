// components/report/MetricTile.tsx
// A dense label/value pair for the rent-roll and leasing metric grids (report
// spec 6, 7). Lighter than a KpiCard: mono caption, tabular sans value, an
// optional semantic tone on the value where it carries health.
import { cn } from "@/lib/cn";
import { toneColor, type Tone } from "@/lib/semantic";

export function MetricTile({
  label,
  value,
  tone,
  className,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <div className={cn("border-l border-hairline pl-3", className)}>
      <div className="font-mono text-caption uppercase tracking-[0.08em] text-muted">
        {label}
      </div>
      <div
        className="mt-1 font-sans text-data tabular"
        style={{ color: tone ? toneColor(tone) : "var(--color-text)" }}
      >
        {value}
      </div>
    </div>
  );
}
