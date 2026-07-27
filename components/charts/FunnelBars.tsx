// components/charts/FunnelBars.tsx
// Leasing funnel (report spec 7.2): a small set of horizontal brick bars scaled
// to the row max, each colored by its own semantic tone (move-ins and renewals
// positive, move-outs and notices watch, evictions problem). Built on the brick
// motif so it stays consistent with the rest of the visual language.
import { BrickBar } from "@/components/primitives/BrickBar";
import type { Tone } from "@/lib/semantic";
import { count } from "@/lib/format";

export interface FunnelRow {
  label: string;
  value: number;
  tone: Tone;
}

export function FunnelBars({
  rows,
  cells = 24,
}: {
  rows: FunnelRow[];
  cells?: number;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="flex flex-col gap-3">
      {rows.map((r) => (
        <BrickBar
          key={r.label}
          label={r.label}
          tone={r.tone}
          fraction={r.value / max}
          value={count(r.value)}
          cells={cells}
        />
      ))}
    </div>
  );
}
