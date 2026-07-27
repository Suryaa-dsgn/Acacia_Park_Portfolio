"use client";
// components/report/ExportBar.tsx
// The export bar in the report header (report spec section 12). Two quiet
// buttons. Excel downloads a workbook with live formulas from the API; PDF prints
// the report using the light palette (export spec 3). Buttons show an inline
// progress state and are themselves excluded from print (no-print).
import { useState } from "react";
import { Button } from "@/components/primitives/Button";
import type { Scope } from "@/lib/types";

export function ExportBar({
  scope,
  quarter,
}: {
  scope: Scope;
  quarter: string;
}) {
  const [excelBusy, setExcelBusy] = useState(false);

  function exportExcel() {
    const params = new URLSearchParams({ scope: scope.kind, quarter });
    if (scope.kind === "property") params.set("propertyId", scope.propertyId);
    setExcelBusy(true);
    // Trigger the download without navigating away.
    const url = `/api/export/excel?${params.toString()}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = "";
    document.body.appendChild(a);
    a.click();
    a.remove();
    // The server sets Content-Disposition; clear the progress state shortly after.
    window.setTimeout(() => setExcelBusy(false), 1500);
  }

  function exportPdf() {
    const root = document.documentElement;
    const prev = root.dataset.theme ?? "";
    root.dataset.theme = "light";
    const restore = () => {
      root.dataset.theme = prev;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    // Setting data-theme applies synchronously; print() flushes styles before
    // capturing, so the light palette is in effect for the printout. (Avoid
    // requestAnimationFrame here: a backgrounded tab may never produce a frame.)
    window.print();
  }

  return (
    <div className="no-print flex items-center gap-2">
      <Button onClick={exportExcel} disabled={excelBusy}>
        {excelBusy ? "Preparing" : "Export Excel"} <span aria-hidden>↓</span>
      </Button>
      <Button onClick={exportPdf}>
        Export PDF <span aria-hidden>↓</span>
      </Button>
    </div>
  );
}
