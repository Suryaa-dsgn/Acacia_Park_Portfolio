import { dataSource } from "@/lib/dataSource";
import { isQuarterSlug } from "@/lib/quarter";
import { holdingsHref } from "@/lib/nav";
import { HoldingReportView } from "@/components/report/HoldingReportView";
import { EmptyState } from "@/components/states/EmptyState";
import { NotFoundState } from "@/components/states/NotFoundState";
import { quarterShortLabel } from "@/lib/quarter";

export default async function HoldingsPage({
  params,
}: {
  params: { quarter: string };
}) {
  const { quarter } = params;
  const quarters = await dataSource.availableQuarters({ kind: "holding" });
  const latestHref = holdingsHref(quarters[quarters.length - 1]);

  if (!isQuarterSlug(quarter)) {
    return <NotFoundState latestHoldingsHref={latestHref} />;
  }

  const report = await dataSource.getReport({ kind: "holding" }, quarter);
  if (!report) {
    return (
      <EmptyState
        title={`No governed report for ${quarterShortLabel(quarter)} yet`}
        message="This quarter has not been imported for the portfolio. It will appear here once the governed data is available."
      />
    );
  }

  return <HoldingReportView report={report} />;
}
