// components/shell/BrandLockup.tsx
// The logo (DG 9.1): a serif wordmark plus a mono descriptor beside it in muted.
// This serif-plus-mono pairing is the brand mark; reused in the header and the
// PDF title block.
import { cn } from "@/lib/cn";

export function BrandLockup({
  className,
  descriptor = "Portfolio Reporting",
}: {
  className?: string;
  descriptor?: string;
}) {
  return (
    <div className={cn("flex items-baseline gap-2.5", className)}>
      <span className="font-serif text-title font-medium text-text-serif">
        Meridian
      </span>
      <span className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-muted">
        {descriptor}
      </span>
    </div>
  );
}
