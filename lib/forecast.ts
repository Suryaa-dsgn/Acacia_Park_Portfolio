// lib/forecast.ts
// An ILLUSTRATIVE occupancy model for the Signal page. This is not a statistical
// forecast; it extends the reported monthly occupancy with a simple trend plus
// mean-reversion and derives a downside/expected/upside band from the observed
// month-over-month volatility. It is fully deterministic (no randomness), so
// server and client render identical values. All callers must label output as
// illustrative.

export interface OccForecast {
  latestIdx: number; // index of the last reported month
  latest: number; // occupancy at latestIdx (fraction)
  modeled: (number | null)[]; // 12 months; null up to latestIdx, expected after
  expected: number; // occupancy at the horizon (fraction)
  downside: number; // expected minus one volatility band
  upside: number; // expected plus one volatility band
  band: number; // half-width of the band (fraction)
}

function mean(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function stddev(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

// Standard normal CDF via the Abramowitz-Stegun erf approximation.
export function normalCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989422804014327 * Math.exp(-(z * z) / 2);
  const p =
    d *
    t *
    (0.319381530 +
      t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return z >= 0 ? 1 - p : p;
}

const LAMBDA = 0.3; // mean-reversion strength
const VOL_FLOOR = 0.003; // a minimum band so a flat history still shows a range

// Extend the reported occupancy series to a horizon (months past the latest
// reported month). shockPts shifts every modeled month by that many occupancy
// points (e.g. -0.02 for a two-point downward swing).
export function forecastOccupancy(
  current: (number | null)[],
  horizonMonths: number,
  shockPts = 0,
): OccForecast {
  const actual: { idx: number; v: number }[] = [];
  current.forEach((v, i) => {
    if (v != null) actual.push({ idx: i, v });
  });

  if (actual.length === 0) {
    return { latestIdx: -1, latest: 0, modeled: current.map(() => null), expected: 0, downside: 0, upside: 0, band: 0 };
  }

  const latestIdx = actual[actual.length - 1].idx;
  const latest = actual[actual.length - 1].v;
  const values = actual.map((a) => a.v);
  const deltas: number[] = [];
  for (let i = 1; i < values.length; i++) deltas.push(values[i] - values[i - 1]);

  const drift = mean(deltas);
  const vol = Math.max(stddev(deltas), VOL_FLOOR);
  const seriesMean = mean(values);

  const modeled: (number | null)[] = current.map(() => null);
  modeled[latestIdx] = latest; // connect the modeled line to the last actual

  let prev = latest;
  const lastMonth = Math.min(latestIdx + horizonMonths, current.length - 1);
  for (let i = latestIdx + 1; i <= lastMonth; i++) {
    const next = prev + drift * (1 - LAMBDA) + LAMBDA * (seriesMean - prev) * 0.5;
    prev = next;
    modeled[i] = clamp01(next + shockPts);
  }

  const horizonIdx = lastMonth;
  const steps = horizonIdx - latestIdx;
  const expected = clamp01((modeled[horizonIdx] ?? latest));
  const band = vol * Math.sqrt(Math.max(steps, 1));

  return {
    latestIdx,
    latest,
    modeled,
    expected,
    downside: clamp01(expected - band),
    upside: clamp01(expected + band),
    band,
  };
}

// Probability that occupancy at the horizon is at least the target, given the
// forecast's expected value and band (band treated as one standard deviation).
export function probabilityAtLeast(f: OccForecast, target: number): number {
  if (f.band <= 0) return f.expected >= target ? 1 : 0;
  return 1 - normalCdf((target - f.expected) / f.band);
}

// Illustrative modeled NOI at a given occupancy, holding operating expenses
// fixed and scaling revenue with occupancy relative to the reported quarter.
export function modeledNoi(
  totalIncome: number,
  opex: number,
  currentOccupancy: number,
  modeledOccupancy: number,
): number {
  if (currentOccupancy <= 0) return totalIncome - opex;
  const scaledIncome = totalIncome * (modeledOccupancy / currentOccupancy);
  return scaledIncome - opex;
}
