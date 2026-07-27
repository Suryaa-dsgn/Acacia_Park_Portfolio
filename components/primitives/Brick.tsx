// components/primitives/Brick.tsx
// The core motif (DG 8.1): one small square equals one countable thing, a unit
// or a quantum of value. Fills with a semantic token, no border needed. Hover
// raises the cell slightly and reveals a tooltip. The interactive hit area is
// padded to stay reachable even though the visual mark is small (DG 11).
import { cn } from "@/lib/cn";

export function Brick({
  color,
  size = 14,
  tooltip,
  interactive,
  className,
}: {
  color: string; // CSS color or var(), e.g. var(--color-pos)
  size?: number;
  tooltip?: string;
  interactive?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "group relative inline-flex items-center justify-center",
        interactive && "cursor-pointer",
        className,
      )}
      title={tooltip}
    >
      <span
        className={cn(
          "block rounded-xs transition-transform duration-[120ms] ease-out",
          interactive &&
            "group-hover:scale-[1.08] motion-reduce:group-hover:scale-100",
        )}
        style={{ width: size, height: size, background: color }}
      />
      {tooltip && interactive && (
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-sm border border-hairline-strong bg-panel-raised px-2 py-1 font-mono text-[0.6875rem] text-ink opacity-0 shadow-md transition-opacity duration-[120ms] group-hover:opacity-100"
        >
          {tooltip}
        </span>
      )}
    </span>
  );
}
