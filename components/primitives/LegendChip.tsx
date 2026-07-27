// components/primitives/LegendChip.tsx
// A small filled square in the series color plus a label (DG 8.7). The square
// shares the brick radius so the whole system feels cut from the same material.
// This is also the color-blind safeguard: color plus text, never color alone.
import { cn } from "@/lib/cn";

export function LegendChip({
  color,
  label,
  value,
  className,
}: {
  color: string; // a CSS color or var(), e.g. toneColor("pos")
  label: React.ReactNode;
  value?: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        aria-hidden
        className="h-3 w-3 shrink-0 rounded-xs"
        style={{ background: color }}
      />
      <span className="font-mono text-caption text-muted">{label}</span>
      {value != null && (
        <span className="font-sans text-caption tabular text-ink">{value}</span>
      )}
    </span>
  );
}
