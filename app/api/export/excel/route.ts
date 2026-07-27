// app/api/export/excel/route.ts
// Excel export endpoint (export spec section 2). Rebuilds the current view's
// report from the same data source the screen uses, then streams a workbook with
// live formulas. Reflects the current (scope, quarter) passed as query params.
import { NextRequest, NextResponse } from "next/server";
import { dataSource } from "@/lib/dataSource";
import { buildWorkbook } from "@/lib/export/buildWorkbook";
import type { Scope } from "@/lib/types";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const kind = params.get("scope");
  const quarter = params.get("quarter") ?? "";
  const propertyId = params.get("propertyId") ?? "";

  const scope: Scope =
    kind === "property"
      ? { kind: "property", propertyId }
      : { kind: "holding" };

  const report = await dataSource.getReport(scope, quarter);
  if (!report) {
    return NextResponse.json({ error: "No report for that scope and quarter" }, { status: 404 });
  }

  const buffer = await buildWorkbook(report);

  const name =
    report.identity.kind === "holding"
      ? "all-holdings"
      : slugify(report.identity.tradeName);
  const filename = `${name}_${quarter}_quarterly-report.xlsx`;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
