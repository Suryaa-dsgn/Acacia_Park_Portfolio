import { describe, it, expect } from "vitest";
import {
  money,
  moneyExact,
  percent,
  signedPct,
  ratio,
  count,
  delta,
  pctChange,
  normalizeText,
} from "./format";

describe("money", () => {
  it("formats whole dollars with separators, no decimals", () => {
    expect(money(1769661.34)).toBe("$1,769,661");
  });
  it("rounds to the nearest dollar", () => {
    expect(money(1769661.9)).toBe("$1,769,662");
  });
  it("renders a loss with a leading minus", () => {
    expect(money(-411459)).toBe("-$411,459");
  });
  it("handles zero", () => {
    expect(money(0)).toBe("$0");
  });
});

describe("moneyExact", () => {
  it("keeps two decimals", () => {
    expect(moneyExact(1769661.34)).toBe("$1,769,661.34");
  });
  it("renders negative cents with a minus", () => {
    expect(moneyExact(-411459.5)).toBe("-$411,459.50");
  });
});

describe("percent", () => {
  it("formats a fraction to one decimal", () => {
    expect(percent(0.957237)).toBe("95.7%");
  });
  it("formats economic occupancy", () => {
    expect(percent(0.927377)).toBe("92.7%");
  });
});

describe("signedPct", () => {
  it("adds a plus sign for gains", () => {
    expect(signedPct(0.027)).toBe("+2.7%");
  });
  it("adds a minus sign for losses", () => {
    expect(signedPct(-0.318)).toBe("-31.8%");
  });
  it("shows no sign for zero", () => {
    expect(signedPct(0)).toBe("0.0%");
  });
});

describe("ratio", () => {
  it("uses the multiplication sign U+00D7", () => {
    expect(ratio(0.92)).toBe("0.92×");
  });
});

describe("count", () => {
  it("groups thousands", () => {
    expect(count(258400)).toBe("258,400");
  });
});

describe("delta", () => {
  it("signs a positive change", () => {
    expect(delta(5)).toBe("+5");
  });
  it("signs a negative change", () => {
    expect(delta(-3)).toBe("-3");
  });
  it("leaves zero unsigned", () => {
    expect(delta(0)).toBe("0");
  });
});

describe("pctChange", () => {
  it("computes year-over-year change", () => {
    // NOI 550204.76 vs prior 806620.77 -> about -31.8%
    const r = pctChange(550204.76, 806620.77);
    expect(r).not.toBeNull();
    expect(signedPct(r as number)).toBe("-31.8%");
  });
  it("returns null when prior is zero (never divides by zero)", () => {
    expect(pctChange(100, 0)).toBeNull();
  });
});

describe("normalizeText (no em dashes reach the UI)", () => {
  it("replaces an em dash with a colon", () => {
    expect(normalizeText("2026 — QUARTER 1")).toBe("2026: QUARTER 1");
  });
  it("replaces en dashes with hyphens", () => {
    expect(normalizeText("January–March")).toBe("January-March");
  });
  it("collapses non-breaking spaces and runs of whitespace", () => {
    expect(normalizeText("Total  Unit   Rent")).toBe("Total Unit Rent");
  });
  it("leaves clean prose untouched", () => {
    expect(normalizeText("Occupancy held near 95 percent.")).toBe(
      "Occupancy held near 95 percent.",
    );
  });
  it("contains no em dash in output", () => {
    const out = normalizeText("A — B — C");
    expect(out.includes("—")).toBe(false);
  });
});
