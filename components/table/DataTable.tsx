"use client";
// components/table/DataTable.tsx
// Financial-broadsheet table (DG 9.4). Real <table> semantics with <th scope>,
// a mono uppercase header underlined with a strong hairline, hairline row
// dividers (no zebra striping), and right-aligned tabular numerics that share a
// clean column edge. Rows that link get a pointer cursor and a raised hover
// background; non-linking rows do not. An optional SortControl above the table
// sorts by any column that supplies a sortValue.
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { SortControl, type SortDir, type SortKey } from "./SortControl";

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  align?: "left" | "right";
  render: (row: T) => React.ReactNode;
  sortValue?: (row: T) => number | string;
  headerClassName?: string;
  cellClassName?: string;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  rowHref,
  caption,
  sortKeys,
  initialSort,
  initialDir = "desc",
  className,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  rowHref?: (row: T) => string | undefined;
  caption?: string;
  sortKeys?: SortKey[];
  initialSort?: string;
  initialDir?: SortDir;
  className?: string;
}) {
  const router = useRouter();
  const [active, setActive] = useState<string | undefined>(initialSort);
  const [dir, setDir] = useState<SortDir>(initialDir);

  const sorted = useMemo(() => {
    if (!active) return rows;
    const col = columns.find((c) => c.key === active);
    if (!col?.sortValue) return rows;
    const getVal = col.sortValue;
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = getVal(a);
      const bv = getVal(b);
      let cmp: number;
      if (typeof av === "number" && typeof bv === "number") cmp = av - bv;
      else cmp = String(av).localeCompare(String(bv));
      return dir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [rows, columns, active, dir]);

  function onSortChange(key: string) {
    if (key === active) {
      setDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setActive(key);
      setDir("desc");
    }
  }

  return (
    <div className={className}>
      {sortKeys && sortKeys.length > 0 && (
        <div className="mb-3 flex justify-end">
          <SortControl
            keys={sortKeys}
            active={active ?? sortKeys[0].key}
            dir={dir}
            onChange={onSortChange}
          />
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className={cn(
                    "border-b border-hairline-strong pb-2 font-mono text-label uppercase text-muted",
                    c.align === "right" ? "text-right" : "text-left",
                    c.headerClassName,
                  )}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => {
              const href = rowHref?.(row);
              const linkable = Boolean(href);
              return (
                <tr
                  key={rowKey(row)}
                  onClick={() => href && router.push(href)}
                  className={cn(
                    "border-b border-hairline transition-colors duration-[120ms]",
                    linkable && "cursor-pointer hover:bg-panel-raised",
                  )}
                >
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={cn(
                        "py-3.5 align-middle",
                        c.align === "right"
                          ? "text-right tabular"
                          : "text-left",
                        c.cellClassName,
                      )}
                    >
                      {c.render(row)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
