// components/report/sections/ReportHeader.tsx
// Report header and property identity (report spec section 2). Composed period
// eyebrow, serif property name, and a grid of labeled facts, closed by a
// hairline. All labels are composed from structured fields (no source em dash).
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { periodEyebrow } from "@/lib/report";
import { count } from "@/lib/format";
import type { PropertyIdentity, ReportMeta } from "@/lib/types";

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="font-mono text-label uppercase text-muted">{label}</dt>
      <dd className="mt-1 font-sans text-data text-ink">{children}</dd>
    </div>
  );
}

export function ReportHeader({
  identity,
  meta,
}: {
  identity: PropertyIdentity;
  meta: ReportMeta;
}) {
  return (
    <header>
      <Eyebrow>{periodEyebrow(meta)}</Eyebrow>
      <h1 className="mt-2 font-serif text-display-lg text-text-serif">
        {identity.tradeName}
      </h1>

      <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-5 md:grid-cols-3">
        <Fact label="Legal Entity">{identity.legalEntity}</Fact>
        <Fact label="Manager">{identity.manager}</Fact>
        <Fact label="Location">
          {identity.addressLine}, {identity.cityStateZip}
          {identity.submarket && (
            <span className="text-muted"> · {identity.submarket}</span>
          )}
        </Fact>
        <Fact label="Units / SF">
          {count(identity.units)} units · {count(identity.totalSqFt)} SF
        </Fact>
        <Fact label="Accounting Basis">{meta.accountingBasis}</Fact>
      </dl>

      <hr className="mt-8 border-hairline" />
    </header>
  );
}
