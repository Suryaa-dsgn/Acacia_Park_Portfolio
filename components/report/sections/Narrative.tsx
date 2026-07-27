// components/report/sections/Narrative.tsx
// Narrative sections (report spec section 9), read-only in this phase. Each is a
// Panel with a serif title and a status tag. Authored prose renders as body text;
// an unwritten section shows a reserved placeholder rather than being hidden, so
// the reader sees what is still pending (the common partial-report state).
import { Panel } from "@/components/primitives/Panel";
import { StatusTag } from "@/components/primitives/StatusTag";
import { narrativeStatusVariant } from "@/lib/report";
import type { NarrativeSection } from "@/lib/types";

export function Narrative({ sections }: { sections: NarrativeSection[] }) {
  return (
    <div className="flex flex-col gap-5">
      {sections.map((section) => (
        <Panel
          key={section.key}
          title={section.title}
          action={
            <StatusTag variant={narrativeStatusVariant(section.status)} />
          }
        >
          {section.body ? (
            <p className="max-w-prose font-sans text-body-lg text-ink">
              {section.body}
            </p>
          ) : (
            <p className="font-sans text-body italic text-muted">
              Not yet written
            </p>
          )}
        </Panel>
      ))}
    </div>
  );
}
