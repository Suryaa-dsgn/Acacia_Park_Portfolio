// components/report/sections/AuditProvenance.tsx
// Audit and provenance (report spec section 11). A quiet list, low-contrast and
// understated. These lines carry the report's credibility, so they render
// faithfully (only em-dash normalized on ingestion). Each line is prefixed with
// a middot.
import { Panel } from "@/components/primitives/Panel";
import type { ProvenanceEntry } from "@/lib/types";

export function AuditProvenance({ entries }: { entries: ProvenanceEntry[] }) {
  return (
    <Panel eyebrow="Audit & Provenance">
      <ul className="flex flex-col gap-2">
        {entries.map((entry, i) => (
          <li
            key={i}
            title={entry.sourceRef}
            className="font-mono text-caption text-muted"
          >
            <span aria-hidden className="text-faint">
              ·{" "}
            </span>
            {entry.text}
          </li>
        ))}
      </ul>
    </Panel>
  );
}
