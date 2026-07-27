// components/report/sections/HoldingHeader.tsx
// Holding report header (report spec section 13.1). The identity becomes a
// portfolio summary: property count, total units, total SF, and the markets.
// Composed from structured fields, no source em dash.
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { periodEyebrow } from "@/lib/report";
import { count } from "@/lib/format";
import type { HoldingIdentity, ReportMeta } from "@/lib/types";

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="font-mono text-label uppercase text-muted">{label}</dt>
      <dd className="mt-1 font-sans text-data text-ink">{children}</dd>
    </div>
  );
}

export function HoldingHeader({
  identity,
  meta,
}: {
  identity: HoldingIdentity;
  meta: ReportMeta;
}) {
  return (
    <header>
      <Eyebrow>{periodEyebrow(meta, "Portfolio Roll-up")}</Eyebrow>
      <h1 className="mt-2 font-serif text-display-lg text-text-serif">
        All Holdings
      </h1>

      <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-5 md:grid-cols-3">
        <Fact label="Properties">{count(identity.propertyCount)}</Fact>
        <Fact label="Total Units">{count(identity.totalUnits)}</Fact>
        <Fact label="Total SF">{count(identity.totalSqFt)}</Fact>
        <Fact label="Markets">
          {identity.markets.length}
          <span className="text-muted"> · {identity.markets.join(", ")}</span>
        </Fact>
        <Fact label="Accounting Basis">{meta.accountingBasis}</Fact>
      </dl>

      <hr className="mt-8 border-hairline" />
    </header>
  );
}
