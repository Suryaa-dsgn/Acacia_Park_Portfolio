// lib/nav.ts
// Path-based routing helpers (IA section 2). Any (scope, quarter) is linkable and
// shareable. Client-safe (pure string work, no data-source access).
//
//   /holdings/:quarter                 -> All Holdings roll-up
//   /property/:propertyId/:quarter     -> single property
//   /signal/:quarter                   -> portfolio signal (forecast)
//   /compare/:quarter                  -> compare up to five properties
import type { QuarterId, Scope } from "./types";

export function holdingsHref(quarter: QuarterId): string {
  return `/holdings/${quarter}`;
}

export function propertyHref(propertyId: string, quarter: QuarterId): string {
  return `/property/${propertyId}/${quarter}`;
}

export function signalHref(quarter: QuarterId): string {
  return `/signal/${quarter}`;
}

export function compareHref(quarter: QuarterId): string {
  return `/compare/${quarter}`;
}

export function hrefForScope(scope: Scope, quarter: QuarterId): string {
  return scope.kind === "holding"
    ? holdingsHref(quarter)
    : propertyHref(scope.propertyId, quarter);
}

export type RouteSection =
  | "holdings"
  | "property"
  | "signal"
  | "compare";

export interface ParsedRoute {
  scope: Scope | null; // set for holdings/property; null for signal/compare
  quarter: QuarterId | null;
  section: RouteSection | null;
}

// Resolve the current section, scope, and quarter from a pathname so the
// navigator and quarter selector can reflect the active selection (IA sections
// 1, 6). Signal and Compare are portfolio-wide sections with no single scope.
export function parseRoute(pathname: string): ParsedRoute {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "holdings" && parts[1]) {
    return { scope: { kind: "holding" }, quarter: parts[1], section: "holdings" };
  }
  if (parts[0] === "property" && parts[1] && parts[2]) {
    return {
      scope: { kind: "property", propertyId: parts[1] },
      quarter: parts[2],
      section: "property",
    };
  }
  if (parts[0] === "signal" && parts[1]) {
    return { scope: null, quarter: parts[1], section: "signal" };
  }
  if (parts[0] === "compare" && parts[1]) {
    return { scope: null, quarter: parts[1], section: "compare" };
  }
  return { scope: null, quarter: null, section: null };
}

// The href for a given quarter within the current route's section. Lets the
// quarter selector switch quarters without leaving Signal or Compare.
export function sectionHref(route: ParsedRoute, quarter: QuarterId): string | null {
  switch (route.section) {
    case "holdings":
      return holdingsHref(quarter);
    case "signal":
      return signalHref(quarter);
    case "compare":
      return compareHref(quarter);
    case "property":
      return route.scope?.kind === "property"
        ? propertyHref(route.scope.propertyId, quarter)
        : null;
    default:
      return null;
  }
}
