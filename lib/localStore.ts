// lib/localStore.ts
// Client-only persistence for in-app edits (authoring drafts, review status, the
// mark-final flag, and uploaded images). The app has no backend, so edits live in
// localStorage keyed by property and quarter. Everything here is SSR-safe: it
// no-ops when window is absent and swallows quota/parse errors, so a failed read
// never breaks a render. Nothing here leaves the browser.
import type { NarrativeStatus } from "./types";

export interface StoredNarrative {
  body?: string; // authored override; undefined keeps the governed body
  status?: NarrativeStatus;
}

export interface ReportEdits {
  narrative: Record<string, StoredNarrative>;
  images: Record<string, string>; // slot -> data URL
  markedFinal: boolean;
}

const EMPTY: ReportEdits = { narrative: {}, images: {}, markedFinal: false };

function keyFor(propertyId: string, quarter: string): string {
  return `meridian:edits:${propertyId}:${quarter}`;
}

export function loadEdits(propertyId: string, quarter: string): ReportEdits {
  if (typeof window === "undefined") return { ...EMPTY };
  try {
    const raw = window.localStorage.getItem(keyFor(propertyId, quarter));
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as Partial<ReportEdits>;
    return {
      narrative: parsed.narrative ?? {},
      images: parsed.images ?? {},
      markedFinal: parsed.markedFinal ?? false,
    };
  } catch {
    return { ...EMPTY };
  }
}

export function saveEdits(
  propertyId: string,
  quarter: string,
  edits: ReportEdits,
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(keyFor(propertyId, quarter), JSON.stringify(edits));
  } catch {
    // Quota or serialization failure: keep the in-memory state, drop the write.
  }
}
