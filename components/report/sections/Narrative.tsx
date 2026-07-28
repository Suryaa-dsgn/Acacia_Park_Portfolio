"use client";
// components/report/sections/Narrative.tsx
// Narrative sections (report spec section 9), editable in-app. The governed body
// and status come from the fixture; a reviewer can author prose, change the
// authoring status, and mark the report final. Edits persist to localStorage,
// scoped to this property and quarter (lib/localStore), and never leave the
// browser. Local edits are applied only after mount, so the server and first
// client render match (the governed values).
import { useEffect, useState } from "react";
import { Panel } from "@/components/primitives/Panel";
import { StatusTag } from "@/components/primitives/StatusTag";
import { Button } from "@/components/primitives/Button";
import { narrativeStatusVariant } from "@/lib/report";
import { loadEdits, saveEdits, type ReportEdits } from "@/lib/localStore";
import type { NarrativeSection, NarrativeStatus } from "@/lib/types";

const STATUSES: NarrativeStatus[] = [
  "Not Started",
  "Gathering Info",
  "Work in Progress",
  "Completed",
];

const EMPTY: ReportEdits = { narrative: {}, images: {}, markedFinal: false };

export function Narrative({
  sections,
  propertyId,
  quarter,
}: {
  sections: NarrativeSection[];
  propertyId: string;
  quarter: string;
}) {
  const [edits, setEdits] = useState<ReportEdits>(EMPTY);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  // Read persisted edits only after mount to avoid a hydration mismatch.
  useEffect(() => {
    setEdits(loadEdits(propertyId, quarter));
  }, [propertyId, quarter]);

  function persist(next: ReportEdits) {
    setEdits(next);
    saveEdits(propertyId, quarter, next);
  }

  function bodyFor(s: NarrativeSection): string {
    return edits.narrative[s.key]?.body ?? s.body ?? "";
  }
  function statusFor(s: NarrativeSection): NarrativeStatus {
    return edits.narrative[s.key]?.status ?? s.status;
  }

  function startEdit(s: NarrativeSection) {
    setEditingKey(s.key);
    setDraft(bodyFor(s));
  }

  function saveBody(key: string) {
    persist({
      ...edits,
      narrative: {
        ...edits.narrative,
        [key]: { ...edits.narrative[key], body: draft },
      },
    });
    setEditingKey(null);
  }

  function setStatus(key: string, status: NarrativeStatus) {
    persist({
      ...edits,
      narrative: {
        ...edits.narrative,
        [key]: { ...edits.narrative[key], status },
      },
    });
  }

  const authored = sections.filter((s) => statusFor(s) === "Completed").length;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-label uppercase tracking-[0.08em] text-muted">
          Completeness: {authored} of {sections.length} sections completed
        </p>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={edits.markedFinal}
            onChange={() => persist({ ...edits, markedFinal: !edits.markedFinal })}
            className="h-4 w-4 accent-accent"
          />
          <span className="font-mono text-label uppercase tracking-[0.08em] text-muted">
            {edits.markedFinal ? "Marked final" : "Mark final"}
          </span>
          {edits.markedFinal && <StatusTag variant="completed">Final</StatusTag>}
        </label>
      </div>

      {sections.map((section) => {
        const status = statusFor(section);
        const body = bodyFor(section);
        const isEditing = editingKey === section.key;
        return (
          <Panel
            key={section.key}
            title={section.title}
            action={
              <div className="flex items-center gap-2">
                <select
                  aria-label={`${section.title} status`}
                  value={status}
                  onChange={(e) => setStatus(section.key, e.target.value as NarrativeStatus)}
                  className="rounded-sm border border-hairline bg-panel px-2 py-1 font-mono text-caption text-muted"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <StatusTag variant={narrativeStatusVariant(status)} />
              </div>
            }
          >
            {isEditing ? (
              <div className="flex flex-col gap-3">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={6}
                  className="w-full rounded-sm border border-hairline bg-panel px-3 py-2 font-sans text-body text-ink focus:border-accent"
                  placeholder={`Write this quarter's ${section.title.toLowerCase()}`}
                />
                <div className="flex gap-2">
                  <Button onClick={() => saveBody(section.key)}>Save</Button>
                  <Button onClick={() => setEditingKey(null)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {body ? (
                  <p className="font-sans text-body text-ink">{body}</p>
                ) : (
                  <p className="font-sans text-body italic text-muted">Not yet written</p>
                )}
                <div>
                  <Button onClick={() => startEdit(section)}>
                    {body ? "Edit" : "Write"}
                  </Button>
                </div>
              </div>
            )}
          </Panel>
        );
      })}
    </div>
  );
}
