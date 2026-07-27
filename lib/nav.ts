// lib/nav.ts
// Path-based routing helpers (IA section 2). Any (scope, quarter) is linkable and
// shareable. Client-safe (pure string work, no data-source access).
//
//   /holdings/:quarter                 -> All Holdings roll-up
//   /property/:propertyId/:quarter     -> single property
import type { QuarterId, Scope } from "./types";

export function holdingsHref(quarter: QuarterId): string {
  return `/holdings/${quarter}`;
}

export function propertyHref(propertyId: string, quarter: QuarterId): string {
  return `/property/${propertyId}/${quarter}`;
}

export function hrefForScope(scope: Scope, quarter: QuarterId): string {
  return scope.kind === "holding"
    ? holdingsHref(quarter)
    : propertyHref(scope.propertyId, quarter);
}

export interface ParsedRoute {
  scope: Scope | null;
  quarter: QuarterId | null;
}

// Resolve the current scope and quarter from a pathname so the navigator and
// quarter selector can reflect the active selection (IA sections 1, 6).
export function parseRoute(pathname: string): ParsedRoute {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "holdings" && parts[1]) {
    return { scope: { kind: "holding" }, quarter: parts[1] };
  }
  if (parts[0] === "property" && parts[1] && parts[2]) {
    return {
      scope: { kind: "property", propertyId: parts[1] },
      quarter: parts[2],
    };
  }
  return { scope: null, quarter: null };
}
