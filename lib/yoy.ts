// lib/yoy.ts
// Year-over-year change with the favorability-aware color rule (DM section 5).
// The arrow reflects the value direction; the color reflects favorability, not
// raw direction. A rising expense shows an up arrow colored coral; a falling NOI
// shows a down arrow colored coral. Null (prior is zero) renders "n/a" muted.
import { pctChange, signedPct } from "./format";
import type { Favorability } from "./types";
import type { Tone } from "./semantic";

export interface Yoy {
  pct: number | null;
  label: string; // "+2.7%", "-31.8%", or "n/a"
  arrow: "" | "up" | "down";
  tone: Tone;
}

export function yoy(
  current: number,
  prior: number,
  favorability: Favorability,
): Yoy {
  const pct = pctChange(current, prior);
  if (pct === null) {
    return { pct: null, label: "n/a", arrow: "", tone: "muted" };
  }
  if (pct === 0) {
    return { pct: 0, label: signedPct(0), arrow: "", tone: "muted" };
  }
  const positiveChange = pct > 0;
  const favorable =
    favorability === "higherIsBetter" ? positiveChange : !positiveChange;
  return {
    pct,
    label: signedPct(pct),
    arrow: positiveChange ? "up" : "down",
    tone: favorable ? "pos" : "neg",
  };
}

// The arrow glyph for a YoY direction. Rendered next to the label.
export function arrowGlyph(arrow: Yoy["arrow"]): string {
  return arrow === "up" ? "▲" : arrow === "down" ? "▼" : "";
}
