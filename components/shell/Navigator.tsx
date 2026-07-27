"use client";
// components/shell/Navigator.tsx
// The left navigator (IA 1.1): search, an All Holdings entry, and the property
// list. Selects which report. The search and All Holdings are pinned at the top;
// the list scrolls beneath. Rows are keyboard navigable (up/down, Enter, and
// type-ahead). Selecting a property keeps the current quarter when that property
// reports it, otherwise falls back to the property's latest quarter (IA 6).
import { useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/primitives/Icon";
import { parseRoute, holdingsHref, propertyHref } from "@/lib/nav";
import type { PropertyListItem, QuarterId } from "@/lib/types";

export function Navigator({
  properties,
  quarters,
  onSelect,
}: {
  properties: PropertyListItem[];
  quarters: QuarterId[];
  onSelect?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { scope, quarter } = parseRoute(pathname);
  const currentQuarter = quarter ?? quarters[quarters.length - 1];

  const [query, setQuery] = useState("");
  const rowRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const typeahead = useRef<{ buffer: string; at: number }>({ buffer: "", at: 0 });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return properties;
    return properties.filter(
      (p) =>
        p.tradeName.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q) ||
        p.state.toLowerCase().includes(q),
    );
  }, [properties, query]);

  function goHolding() {
    router.push(holdingsHref(currentQuarter));
    onSelect?.();
  }

  function goProperty(p: PropertyListItem) {
    const target = p.availableQuarters.includes(currentQuarter)
      ? currentQuarter
      : p.availableQuarters[p.availableQuarters.length - 1];
    router.push(propertyHref(p.propertyId, target));
    onSelect?.();
  }

  function onListKeyDown(e: React.KeyboardEvent) {
    const n = filtered.length;
    if (n === 0) return;
    const focusedIndex = rowRefs.current.findIndex(
      (el) => el === document.activeElement,
    );
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = focusedIndex < 0 ? 0 : Math.min(focusedIndex + 1, n - 1);
      rowRefs.current[next]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = focusedIndex < 0 ? 0 : Math.max(focusedIndex - 1, 0);
      rowRefs.current[prev]?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      rowRefs.current[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      rowRefs.current[n - 1]?.focus();
    } else if (/^[a-z0-9]$/i.test(e.key)) {
      // type-ahead: jump to the next row whose name starts with the buffer
      const t = typeahead.current;
      const now = Date.now();
      t.buffer = now - t.at > 800 ? e.key : t.buffer + e.key;
      t.at = now;
      const match = filtered.findIndex((p) =>
        p.tradeName.toLowerCase().startsWith(t.buffer.toLowerCase()),
      );
      if (match >= 0) rowRefs.current[match]?.focus();
    }
  }

  const holdingSelected = scope?.kind === "holding";

  return (
    <div className="flex h-full flex-col">
      {/* pinned: search + All Holdings */}
      <div className="shrink-0 space-y-3 p-4">
        <label className="relative block">
          <span className="sr-only">Search properties</span>
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint">
            <Icon name="search" size={15} />
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search properties"
            className="w-full rounded-sm border border-hairline bg-panel py-2 pl-9 pr-3 font-sans text-body text-ink placeholder:text-faint focus:border-accent"
          />
        </label>

        <button
          onClick={goHolding}
          aria-current={holdingSelected ? "page" : undefined}
          className={cn(
            "flex w-full items-center gap-3 rounded-sm border-l-2 px-3 py-2.5 text-left transition-colors",
            holdingSelected
              ? "border-accent bg-panel-raised"
              : "border-transparent hover:bg-panel-raised",
          )}
        >
          <Icon name="grid" className="text-muted" />
          <span className="min-w-0">
            <span className="block font-sans text-data font-medium text-ink">
              All Holdings
            </span>
            <span className="block font-sans text-caption text-muted">
              Portfolio roll-up
            </span>
          </span>
        </button>
      </div>

      <hr className="mx-4 border-hairline" />

      {/* section label */}
      <p className="shrink-0 px-4 pb-2 pt-3 font-mono text-label uppercase text-muted">
        Properties ({filtered.length})
      </p>

      {/* scrolling property list */}
      <nav aria-label="Properties" className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        {filtered.length === 0 ? (
          <p className="px-2 py-3 font-mono text-caption text-muted">
            No properties match &ldquo;{query}&rdquo;
          </p>
        ) : (
          <ul onKeyDown={onListKeyDown}>
            {filtered.map((p, i) => {
              const selected =
                scope?.kind === "property" && scope.propertyId === p.propertyId;
              return (
                <li key={p.propertyId}>
                  <button
                    ref={(el) => {
                      rowRefs.current[i] = el;
                    }}
                    onClick={() => goProperty(p)}
                    aria-current={selected ? "page" : undefined}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-sm border-l-2 px-3 py-2.5 text-left transition-colors",
                      selected
                        ? "border-accent bg-panel-raised"
                        : "border-transparent hover:bg-panel-raised",
                    )}
                  >
                    <Icon name="building" className="text-muted" />
                    <span className="min-w-0">
                      <span className="block truncate font-sans text-data font-medium text-ink">
                        {p.tradeName}
                      </span>
                      <span className="block truncate font-sans text-caption text-muted">
                        {p.city}, {p.state}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </nav>
    </div>
  );
}
