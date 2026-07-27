// components/states/Skeleton.tsx
// Loading skeletons that match the final layout (IA section 4): KPI card blocks,
// a table frame, chart frames. The shimmer and its reduced-motion fallback live
// in base.css (.skeleton). Never a bare spinner.
import { cn } from "@/lib/cn";

function Block({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-sm", className)} />;
}

export function ReportSkeleton() {
  return (
    <div className="space-y-12" aria-hidden>
      {/* header */}
      <div className="space-y-3">
        <Block className="h-3 w-64" />
        <Block className="h-9 w-80" />
        <Block className="h-4 w-full max-w-xl" />
      </div>
      {/* KPI row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 shell:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Block key={i} className="h-28 rounded-md" />
        ))}
      </div>
      {/* table frame */}
      <div className="space-y-3">
        <Block className="h-4 w-40" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Block key={i} className="h-8 w-full" />
        ))}
      </div>
      {/* two chart frames */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Block className="h-64 rounded-md" />
        <Block className="h-64 rounded-md" />
      </div>
    </div>
  );
}
