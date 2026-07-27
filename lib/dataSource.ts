// lib/dataSource.ts
// The data-source seam (DM section 7). Components resolve a (scope, quarter) to a
// typed QuarterlyReport through this interface and never know where the data
// comes from. Phase 1/2 reads governed fixture JSON from disk; a later phase
// swaps in an API behind the same interface without touching any component.
//
// FixtureDataSource is server-side (it reads the filesystem). The holding
// roll-up is computed at read time from the property fixtures via
// aggregateHolding, so the roll-up path is real and always agrees with export.
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type {
  QuarterId,
  QuarterlyReport,
  PropertyListItem,
  Scope,
} from "./types";
import { normalizeReport } from "./normalize";
import { aggregateHolding } from "./aggregate";

export interface DataSource {
  listProperties(): Promise<PropertyListItem[]>;
  getReport(scope: Scope, quarter: QuarterId): Promise<QuarterlyReport | null>;
  availableQuarters(scope: Scope): Promise<QuarterId[]>;
}

interface Manifest {
  quarters: QuarterId[];
  properties: PropertyListItem[];
}

export class FixtureDataSource implements DataSource {
  private readonly root: string;
  private manifestCache: Manifest | null = null;

  constructor(root?: string) {
    this.root = root ?? join(process.cwd(), "fixtures");
  }

  private manifest(): Manifest {
    if (!this.manifestCache) {
      const raw = readFileSync(join(this.root, "manifest.json"), "utf8");
      this.manifestCache = JSON.parse(raw) as Manifest;
    }
    return this.manifestCache;
  }

  private readProperty(
    propertyId: string,
    quarter: QuarterId,
  ): QuarterlyReport | null {
    const path = join(this.root, propertyId, `${quarter}.json`);
    if (!existsSync(path)) return null;
    const report = JSON.parse(readFileSync(path, "utf8")) as QuarterlyReport;
    return normalizeReport(report);
  }

  async listProperties(): Promise<PropertyListItem[]> {
    return this.manifest().properties;
  }

  async availableQuarters(scope: Scope): Promise<QuarterId[]> {
    const m = this.manifest();
    if (scope.kind === "property") {
      const p = m.properties.find((x) => x.propertyId === scope.propertyId);
      return p ? p.availableQuarters : [];
    }
    // Holding is available for any quarter at least one property reports.
    const set = new Set<QuarterId>();
    for (const p of m.properties)
      for (const q of p.availableQuarters) set.add(q);
    return m.quarters.filter((q) => set.has(q));
  }

  async getReport(
    scope: Scope,
    quarter: QuarterId,
  ): Promise<QuarterlyReport | null> {
    if (scope.kind === "property") {
      return this.readProperty(scope.propertyId, quarter);
    }
    // Holding: gather every property that reports this quarter, then roll up.
    const m = this.manifest();
    const reports: QuarterlyReport[] = [];
    for (const p of m.properties) {
      if (!p.availableQuarters.includes(quarter)) continue;
      const r = this.readProperty(p.propertyId, quarter);
      if (r) reports.push(r);
    }
    if (reports.length === 0) return null;
    return normalizeReport(aggregateHolding(reports));
  }
}

// The default instance used by the app. Swap this for an ApiDataSource later.
export const dataSource: DataSource = new FixtureDataSource();
