// components/report/sections/OperatingStatement.tsx
// The operating statement (report spec section 4). A financial-statement table:
// grouped PERIOD-TO-DATE and YEAR-TO-DATE columns, each with prior, current, and
// a favorability-colored %Δ. Income group, expense group, subtotals with a
// strong hairline, and the NOI result row. Hairline row dividers only, no zebra.
import { Panel } from "@/components/primitives/Panel";
import { money } from "@/lib/format";
import { yoy, arrowGlyph } from "@/lib/yoy";
import { statementColumns } from "@/lib/report";
import { toneColor } from "@/lib/semantic";
import type { StatementLine, QuarterlyReport } from "@/lib/types";

function DeltaCell({
  current,
  prior,
  favorability,
}: {
  current: number;
  prior: number;
  favorability: StatementLine["favorability"];
}) {
  const y = yoy(current, prior, favorability);
  if (y.pct === null) {
    return <span className="text-faint">n/a</span>;
  }
  return (
    <span style={{ color: toneColor(y.tone) }}>
      {arrowGlyph(y.arrow)} {y.label}
    </span>
  );
}

function LineRow({
  line,
  emphasis,
  result,
}: {
  line: StatementLine;
  emphasis?: boolean;
  result?: boolean;
}) {
  const positiveResult = result && line.ptdCurrent > 0;
  const py = result ? "py-3" : "py-1.5";
  const firstPl = result ? "pl-3" : "";
  const lastPr = result ? "pr-3" : "";
  return (
    <tr
      className={cnRow(emphasis, result)}
      style={
        positiveResult ? { background: "var(--color-pos-soft)" } : undefined
      }
    >
      <th
        scope="row"
        title={line.glCode ? `GL ${line.glCode}` : undefined}
        className={`${py} ${firstPl} pr-3 text-left font-sans ${
          emphasis || result ? "font-semibold text-text-serif" : "font-normal text-ink"
        }`}
      >
        {line.label}
      </th>
      <td className={`${py} pl-3 text-right tabular text-ink`}>{money(line.ptdPrior)}</td>
      <td className={`${py} pl-3 text-right tabular text-ink`}>{money(line.ptdCurrent)}</td>
      <td className={`${py} pl-3 text-right tabular`}>
        <DeltaCell current={line.ptdCurrent} prior={line.ptdPrior} favorability={line.favorability} />
      </td>
      <td className={`${py} pl-4 text-right tabular text-ink`}>{money(line.ytdPrior)}</td>
      <td className={`${py} pl-3 text-right tabular text-ink`}>{money(line.ytdCurrent)}</td>
      <td className={`${py} pl-3 ${lastPr} text-right tabular`}>
        <DeltaCell current={line.ytdCurrent} prior={line.ytdPrior} favorability={line.favorability} />
      </td>
    </tr>
  );
}

function cnRow(emphasis?: boolean, result?: boolean): string {
  if (result) return "border-t-2 border-hairline-strong";
  if (emphasis) return "border-t border-hairline-strong";
  return "border-b border-hairline";
}

function GroupRow({ label }: { label: string }) {
  return (
    <tr>
      <td
        colSpan={7}
        className="pb-2 pt-4 font-mono text-label uppercase text-muted"
      >
        {label}
      </td>
    </tr>
  );
}

export function OperatingStatement({ report, className }: { report: QuarterlyReport; className?: string }) {
  const os = report.operatingStatement;
  const cols = statementColumns(report.meta);

  return (
    <Panel
      eyebrow="Financials"
      title="Operating Statement"
      description="Period-to-date and year-to-date, current versus prior year."
      className={className}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-[0.8rem]">
          <thead>
            <tr>
              <td className="w-[26%]" />
              <th
                scope="colgroup"
                colSpan={3}
                className="border-b border-hairline pb-1 text-center font-mono text-label uppercase text-muted"
              >
                Period-to-Date
              </th>
              <th
                scope="colgroup"
                colSpan={3}
                className="border-b border-hairline pb-1 pl-4 text-center font-mono text-label uppercase text-muted"
              >
                Year-to-Date
              </th>
            </tr>
            <tr className="border-b border-hairline-strong">
              <th scope="col" className="pb-2 text-left font-mono text-label uppercase text-muted">
                Account
              </th>
              <th scope="col" className="pb-2 pl-3 text-right font-mono text-label uppercase text-muted">{cols.prior}</th>
              <th scope="col" className="pb-2 pl-3 text-right font-mono text-label uppercase text-muted">{cols.current}</th>
              <th scope="col" className="pb-2 pl-3 text-right font-mono text-label uppercase text-muted">%Δ</th>
              <th scope="col" className="pb-2 pl-4 text-right font-mono text-label uppercase text-muted">{cols.prior}</th>
              <th scope="col" className="pb-2 pl-3 text-right font-mono text-label uppercase text-muted">{cols.current}</th>
              <th scope="col" className="pb-2 pl-3 text-right font-mono text-label uppercase text-muted">%Δ</th>
            </tr>
          </thead>
          <tbody>
            <GroupRow label="Income" />
            {os.income.map((line) => (
              <LineRow key={line.key} line={line} />
            ))}
            <LineRow line={os.totalIncome} emphasis />

            <GroupRow label="Operating Expenses" />
            {os.expenses.map((line) => (
              <LineRow key={line.key} line={line} />
            ))}
            <LineRow line={os.totalOperatingExpenses} emphasis />

            <LineRow line={os.netOperatingIncome} result />
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
