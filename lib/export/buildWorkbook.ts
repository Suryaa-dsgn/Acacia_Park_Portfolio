// lib/export/buildWorkbook.ts
// Excel export (export spec section 2). Server-side only (imports exceljs).
// Mirrors the governed sheet structure so the client recognizes it: an operating
// statement whose subtotals, NOI, and %Δ are LIVE formulas referencing the input
// cells, so the workbook recalculates if a value is edited. Widely supported
// functions only (SUM, IFERROR). No em dash anywhere.
import ExcelJS from "exceljs";
import type { QuarterlyReport, StatementLine } from "@/lib/types";
import { statementColumns, monthRange, usDate } from "@/lib/report";
import { MONTH_ABBR } from "@/lib/report";
import { aggregateHolding } from "@/lib/aggregate";
import { pctChange } from "@/lib/format";

const MONEY_FMT = '$#,##0;($#,##0);"-"';
const PCT_FMT = '0.0%;(0.0%);"-"';
const FONT = { name: "Arial", size: 10 };
const LABEL_COL = 2; // B
const COLS = { acct: 2, pPrior: 3, pCur: 4, pPct: 5, yPrior: 6, yCur: 7, yPct: 8 };

function quarterSheetName(report: QuarterlyReport): string {
  const { fiscalYear, quarterNumber } = report.meta;
  return `Q${quarterNumber} ${fiscalYear} Narrative`;
}

function eyebrow(report: QuarterlyReport): string {
  const { fiscalYear, quarterNumber } = report.meta;
  const scope = report.scope.kind === "holding" ? "Portfolio Roll-up" : "Quarterly Operating Report";
  return `${scope}  ·  ${fiscalYear}  ·  Quarter ${quarterNumber}  ·  ${monthRange(report.meta)}`;
}

function setLabel(ws: ExcelJS.Worksheet, row: number, text: string) {
  const c = ws.getCell(row, LABEL_COL);
  c.value = text;
  c.font = { ...FONT, bold: true };
}

function kv(ws: ExcelJS.Worksheet, row: number, label: string, value: string | number) {
  ws.getCell(row, 2).value = label;
  ws.getCell(row, 2).font = FONT;
  const v = ws.getCell(row, 4);
  v.value = value;
  v.font = FONT;
}

// Write one statement line: inputs as values, %Δ as a live formula.
function writeStatementLine(
  ws: ExcelJS.Worksheet,
  row: number,
  line: StatementLine,
  bold = false,
) {
  const f = { ...FONT, bold };
  ws.getCell(row, COLS.acct).value = line.label;
  ws.getCell(row, COLS.acct).font = f;
  for (const [colV, colP, valCur, valPrior] of [
    [COLS.pCur, COLS.pPrior, line.ptdCurrent, line.ptdPrior],
    [COLS.yCur, COLS.yPrior, line.ytdCurrent, line.ytdPrior],
  ] as const) {
    ws.getCell(row, colP).value = valPrior;
    ws.getCell(row, colP).numFmt = MONEY_FMT;
    ws.getCell(row, colP).font = f;
    ws.getCell(row, colV).value = valCur;
    ws.getCell(row, colV).numFmt = MONEY_FMT;
    ws.getCell(row, colV).font = f;
  }
  // %Δ formulas (PTD in E, YTD in H) reference the two input cells.
  const eL = ws.getColumn(COLS.pPrior).letter;
  const dL = ws.getColumn(COLS.pCur).letter;
  const fL = ws.getColumn(COLS.yPrior).letter;
  const gL = ws.getColumn(COLS.yCur).letter;
  ws.getCell(row, COLS.pPct).value = { formula: `IFERROR((${dL}${row}-${eL}${row})/${eL}${row},"-")` };
  ws.getCell(row, COLS.pPct).numFmt = PCT_FMT;
  ws.getCell(row, COLS.pPct).font = f;
  ws.getCell(row, COLS.yPct).value = { formula: `IFERROR((${gL}${row}-${fL}${row})/${fL}${row},"-")` };
  ws.getCell(row, COLS.yPct).numFmt = PCT_FMT;
  ws.getCell(row, COLS.yPct).font = f;
}

// Subtotal row whose prior/current are SUM formulas over a range, %Δ a formula.
function writeSubtotalRow(
  ws: ExcelJS.Worksheet,
  row: number,
  label: string,
  startRow: number,
  endRow: number,
) {
  const f = { ...FONT, bold: true };
  ws.getCell(row, COLS.acct).value = label;
  ws.getCell(row, COLS.acct).font = f;
  const letters = {
    pPrior: ws.getColumn(COLS.pPrior).letter,
    pCur: ws.getColumn(COLS.pCur).letter,
    yPrior: ws.getColumn(COLS.yPrior).letter,
    yCur: ws.getColumn(COLS.yCur).letter,
  };
  for (const col of [COLS.pPrior, COLS.pCur, COLS.yPrior, COLS.yCur]) {
    const L = ws.getColumn(col).letter;
    ws.getCell(row, col).value = { formula: `SUM(${L}${startRow}:${L}${endRow})` };
    ws.getCell(row, col).numFmt = MONEY_FMT;
    ws.getCell(row, col).font = f;
  }
  ws.getCell(row, COLS.pPct).value = { formula: `IFERROR((${letters.pCur}${row}-${letters.pPrior}${row})/${letters.pPrior}${row},"-")` };
  ws.getCell(row, COLS.pPct).numFmt = PCT_FMT;
  ws.getCell(row, COLS.pPct).font = f;
  ws.getCell(row, COLS.yPct).value = { formula: `IFERROR((${letters.yCur}${row}-${letters.yPrior}${row})/${letters.yPrior}${row},"-")` };
  ws.getCell(row, COLS.yPct).numFmt = PCT_FMT;
  ws.getCell(row, COLS.yPct).font = f;
}

// NOI row = Total Income - Total Operating Expenses (formula per column).
function writeNoiRow(
  ws: ExcelJS.Worksheet,
  row: number,
  incomeRow: number,
  opexRow: number,
) {
  const f = { ...FONT, bold: true };
  ws.getCell(row, COLS.acct).value = "Net Operating Income";
  ws.getCell(row, COLS.acct).font = f;
  for (const col of [COLS.pPrior, COLS.pCur, COLS.yPrior, COLS.yCur]) {
    const L = ws.getColumn(col).letter;
    ws.getCell(row, col).value = { formula: `${L}${incomeRow}-${L}${opexRow}` };
    ws.getCell(row, col).numFmt = MONEY_FMT;
    ws.getCell(row, col).font = f;
  }
  const pCur = ws.getColumn(COLS.pCur).letter, pPrior = ws.getColumn(COLS.pPrior).letter;
  const yCur = ws.getColumn(COLS.yCur).letter, yPrior = ws.getColumn(COLS.yPrior).letter;
  ws.getCell(row, COLS.pPct).value = { formula: `IFERROR((${pCur}${row}-${pPrior}${row})/${pPrior}${row},"-")` };
  ws.getCell(row, COLS.pPct).numFmt = PCT_FMT;
  ws.getCell(row, COLS.pPct).font = f;
  ws.getCell(row, COLS.yPct).value = { formula: `IFERROR((${yCur}${row}-${yPrior}${row})/${yPrior}${row},"-")` };
  ws.getCell(row, COLS.yPct).numFmt = PCT_FMT;
  ws.getCell(row, COLS.yPct).font = f;
}

function buildNarrativeSheet(wb: ExcelJS.Workbook, report: QuarterlyReport) {
  const ws = wb.addWorksheet(quarterSheetName(report));
  ws.columns = [
    { width: 2 },
    { width: 34 },
    { width: 14 },
    { width: 14 },
    { width: 12 },
    { width: 14 },
    { width: 14 },
    { width: 12 },
  ];
  const cols = statementColumns(report.meta);
  let r = 2;

  // Title + eyebrow
  const title = report.identity.kind === "holding" ? report.identity.label : report.identity.tradeName;
  ws.getCell(r, 2).value = title;
  ws.getCell(r, 2).font = { ...FONT, bold: true, size: 14 };
  r += 1;
  ws.getCell(r, 2).value = eyebrow(report);
  ws.getCell(r, 2).font = { ...FONT, italic: true };
  r += 2;

  // Identity block
  if (report.identity.kind === "property") {
    const id = report.identity;
    setLabel(ws, r, "PROPERTY IDENTITY"); r += 1;
    kv(ws, r++, "Legal Entity", id.legalEntity);
    kv(ws, r++, "Trade Name", id.tradeName);
    kv(ws, r++, "Manager", id.manager);
    kv(ws, r++, "Address", `${id.addressLine}, ${id.cityStateZip}`);
    kv(ws, r++, "Units", id.units);
    kv(ws, r++, "Total SF", id.totalSqFt);
  } else {
    const id = report.identity;
    setLabel(ws, r, "PORTFOLIO SUMMARY"); r += 1;
    kv(ws, r++, "Properties", id.propertyCount);
    kv(ws, r++, "Total Units", id.totalUnits);
    kv(ws, r++, "Total SF", id.totalSqFt);
    kv(ws, r++, "Markets", id.markets.join(", "));
  }
  kv(ws, r++, "Reporting Period", monthRange(report.meta));
  kv(ws, r++, "Accounting Basis", report.meta.accountingBasis);
  r += 1;

  // Operating statement
  setLabel(ws, r, "OPERATING STATEMENT  (Cash Basis)"); r += 1;
  ws.getCell(r, COLS.pPrior).value = "Period-to-Date";
  ws.getCell(r, COLS.pPrior).font = { ...FONT, bold: true };
  ws.mergeCells(r, COLS.pPrior, r, COLS.pPct);
  ws.getCell(r, COLS.yPrior).value = "Year-to-Date";
  ws.getCell(r, COLS.yPrior).font = { ...FONT, bold: true };
  ws.mergeCells(r, COLS.yPrior, r, COLS.yPct);
  r += 1;
  const hdr = ["Account", cols.prior, cols.current, "%Δ", cols.prior, cols.current, "%Δ"];
  hdr.forEach((h, i) => {
    const c = ws.getCell(r, COLS.acct + i);
    c.value = h;
    c.font = { ...FONT, bold: true };
    c.border = { bottom: { style: "thin" } };
  });
  r += 1;

  const os = report.operatingStatement;
  ws.getCell(r, COLS.acct).value = "INCOME";
  ws.getCell(r, COLS.acct).font = { ...FONT, bold: true };
  r += 1;
  const incomeStart = r;
  for (const line of os.income) writeStatementLine(ws, r++, line);
  const incomeEnd = r - 1;
  const totalIncomeRow = r;
  writeSubtotalRow(ws, r++, "Total Income", incomeStart, incomeEnd);
  r += 1;

  ws.getCell(r, COLS.acct).value = "OPERATING EXPENSES";
  ws.getCell(r, COLS.acct).font = { ...FONT, bold: true };
  r += 1;
  const expStart = r;
  for (const line of os.expenses) writeStatementLine(ws, r++, line);
  const expEnd = r - 1;
  const totalOpexRow = r;
  writeSubtotalRow(ws, r++, "Total Operating Expenses", expStart, expEnd);
  writeNoiRow(ws, r++, totalIncomeRow, totalOpexRow);
  r += 2;

  // Rent roll
  setLabel(ws, r, `RENT ROLL SUMMARY  (as of ${usDate(report.rentRoll.asOf)})`); r += 1;
  const rr = report.rentRoll;
  const rrRows: [string, number, boolean][] = [
    ["Total Units", rr.totalUnits, false],
    ["Occupied Units", rr.occupiedUnits, false],
    ["Vacant Units", rr.vacantUnits, false],
    ["Physical Occupancy", rr.physicalOccupancy, true],
    ["Total SF", rr.totalSqFt, false],
    ["Avg Unit Sq Ft", rr.avgUnitSqFt, false],
    ["Avg Unit Rent", rr.avgUnitRent, false],
    ["Avg Occupied Unit Rent", rr.avgOccupiedUnitRent, false],
    ["Avg Resident Rent", rr.avgResidentRent, false],
    ["Total Market Rent", rr.totalMarketRent, false],
    ["Total Unit Rent (in place)", rr.totalInPlaceRent, false],
    ["Economic Occupancy", rr.economicOccupancy, true],
  ];
  for (const [label, value, isPct] of rrRows) {
    ws.getCell(r, 2).value = label;
    ws.getCell(r, 2).font = FONT;
    const v = ws.getCell(r, 4);
    v.value = value;
    v.font = FONT;
    if (isPct) v.numFmt = PCT_FMT;
    else if (/Rent/.test(label)) v.numFmt = MONEY_FMT;
    r += 1;
  }
  r += 1;

  // Leasing
  setLabel(ws, r, "LEASING ACTIVITY"); r += 1;
  if (report.leasing) {
    const l = report.leasing;
    const leasingRows: [string, number][] = [
      ["Move-Ins", l.moveIns],
      ["Move-Outs", l.moveOuts],
      ["Net Absorption", l.netAbsorption],
      ["Notices to Vacate", l.noticesToVacate],
      ["Units Rented", l.unitsRented],
      ["Renewals", l.renewals],
      ["Evictions", l.evictions],
    ];
    for (const [label, value] of leasingRows) {
      ws.getCell(r, 2).value = label;
      ws.getCell(r, 2).font = FONT;
      ws.getCell(r, 4).value = value;
      ws.getCell(r, 4).font = FONT;
      r += 1;
    }
  } else {
    ws.getCell(r, 2).value = "Not governed for this quarter.";
    ws.getCell(r, 2).font = { ...FONT, italic: true };
    r += 1;
  }
  r += 1;

  // Narrative
  if (report.narrative) {
    setLabel(ws, r, "NARRATIVE"); r += 1;
    for (const n of report.narrative) {
      ws.getCell(r, 2).value = `${n.title}  (${n.status})`;
      ws.getCell(r, 2).font = { ...FONT, bold: true };
      r += 1;
      ws.getCell(r, 2).value = n.body ?? "Not yet written.";
      ws.getCell(r, 2).font = FONT;
      ws.getCell(r, 2).alignment = { wrapText: true };
      r += 2;
    }
  }

  // Audit
  setLabel(ws, r, "AUDIT & PROVENANCE"); r += 1;
  for (const p of report.provenance) {
    ws.getCell(r, 2).value = `·  ${p.text}`;
    ws.getCell(r, 2).font = FONT;
    ws.getCell(r, 2).alignment = { wrapText: true };
    r += 1;
  }

  return ws;
}

function buildOccupancySheet(wb: ExcelJS.Workbook, report: QuarterlyReport) {
  const s = report.occupancySeries;
  const ws = wb.addWorksheet(`Occupancy ${s.priorYear} and ${s.currentYear}`);
  ws.getColumn(1).width = 16;
  for (let i = 0; i < 12; i++) ws.getColumn(2 + i).width = 8;
  ws.getCell(2, 1).value = `Physical Occupancy  ·  ${report.identity.kind === "holding" ? report.identity.label : report.identity.tradeName}`;
  ws.getCell(2, 1).font = { ...FONT, bold: true };
  // month header
  ws.getCell(4, 1).value = "Month";
  ws.getCell(4, 1).font = { ...FONT, bold: true };
  MONTH_ABBR.forEach((m, i) => {
    ws.getCell(4, 2 + i).value = m;
    ws.getCell(4, 2 + i).font = { ...FONT, bold: true };
  });
  const writeRow = (row: number, year: number, values: (number | null)[]) => {
    ws.getCell(row, 1).value = String(year);
    ws.getCell(row, 1).font = FONT;
    values.forEach((v, i) => {
      const c = ws.getCell(row, 2 + i);
      c.value = v == null ? "-" : v;
      if (v != null) c.numFmt = PCT_FMT;
      c.font = FONT;
    });
  };
  writeRow(5, s.priorYear, s.prior);
  writeRow(6, s.currentYear, s.current);
  return ws;
}

// Holding-only Properties sheet: per-property NOI, occupancy, YoY NOI.
function buildPropertiesSheet(wb: ExcelJS.Workbook, report: QuarterlyReport) {
  if (!report.composition) return;
  const ws = wb.addWorksheet("Properties");
  ws.columns = [
    { width: 28 },
    { width: 22 },
    { width: 10 },
    { width: 16 },
    { width: 12 },
    { width: 12 },
  ];
  const header = ["Property", "Location", "Units", "Quarter NOI", "Occupancy", "YoY NOI"];
  header.forEach((h, i) => {
    const c = ws.getCell(1, 1 + i);
    c.value = h;
    c.font = { ...FONT, bold: true };
    c.border = { bottom: { style: "thin" } };
  });
  const sorted = [...report.composition.properties].sort((a, b) => b.noi - a.noi);
  sorted.forEach((p, i) => {
    const row = 2 + i;
    ws.getCell(row, 1).value = p.tradeName;
    ws.getCell(row, 2).value = `${p.city}, ${p.state}`;
    ws.getCell(row, 3).value = p.units;
    ws.getCell(row, 4).value = p.noi;
    ws.getCell(row, 4).numFmt = MONEY_FMT;
    ws.getCell(row, 5).value = p.occupancy;
    ws.getCell(row, 5).numFmt = PCT_FMT;
    ws.getCell(row, 6).value = p.yoyNoi ?? "-";
    if (p.yoyNoi != null) ws.getCell(row, 6).numFmt = PCT_FMT;
    for (let c = 1; c <= 6; c++) ws.getCell(row, c).font = FONT;
  });
}

export async function buildWorkbook(
  report: QuarterlyReport,
): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Portfolio Reporting";
  wb.created = new Date(report.meta.generatedAt);

  buildNarrativeSheet(wb, report);
  buildOccupancySheet(wb, report);
  if (report.scope.kind === "holding") buildPropertiesSheet(wb, report);

  const arrayBuffer = await wb.xlsx.writeBuffer();
  return arrayBuffer as ArrayBuffer;
}

// Re-export for the route: rebuild a holding report from property reports if
// the export is asked for a holding scope (uses the same aggregation as screen).
export { aggregateHolding, pctChange };
