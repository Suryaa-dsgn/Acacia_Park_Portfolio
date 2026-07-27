import { dataSource } from "@/lib/dataSource";
import { isQuarterSlug, quarterShortLabel } from "@/lib/quarter";
import { holdingsHref } from "@/lib/nav";
import { ReportPlaceholder } from "@/components/report/ReportPlaceholder";
import { EmptyState } from "@/components/states/EmptyState";
import { NotFoundState } from "@/components/states/NotFoundState";

export default async function PropertyPage({
  params,
}: {
  params: { propertyId: string; quarter: string };
}) {
  const { propertyId, quarter } = params;
  const [properties, holdingQuarters] = await Promise.all([
    dataSource.listProperties(),
    dataSource.availableQuarters({ kind: "holding" }),
  ]);
  const latestHref = holdingsHref(holdingQuarters[holdingQuarters.length - 1]);

  const property = properties.find((p) => p.propertyId === propertyId);
  // Unknown property or malformed quarter is a bad route, not an empty report.
  if (!property || !isQuarterSlug(quarter)) {
    return <NotFoundState latestHoldingsHref={latestHref} />;
  }

  const report = await dataSource.getReport(
    { kind: "property", propertyId },
    quarter,
  );
  // Valid property, valid quarter slug, but no governed report for this quarter.
  if (!report) {
    return (
      <EmptyState
        title={`No governed report for ${quarterShortLabel(quarter)} yet`}
        message={`${property.tradeName} has no imported report for this quarter. Pick another quarter, or check back once the data is governed.`}
      />
    );
  }

  return <ReportPlaceholder report={report} />;
}
