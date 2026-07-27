import { dataSource } from "@/lib/dataSource";
import { isQuarterSlug, quarterShortLabel } from "@/lib/quarter";
import { holdingsHref } from "@/lib/nav";
import { computeRatios } from "@/lib/ratios";
import { CompareView, type CompareProperty } from "@/components/report/CompareView";
import { EmptyState } from "@/components/states/EmptyState";
import { NotFoundState } from "@/components/states/NotFoundState";

// Compare up to five properties for a quarter. Server-fetches each property's
// current-quarter report (metrics + ratios) plus its NOI/occupancy across every
// available quarter, so the trend charts fill in as more quarters are imported.
export default async function ComparePage({
  params,
}: {
  params: { quarter: string };
}) {
  const { quarter } = params;
  const allQuarters = await dataSource.availableQuarters({ kind: "holding" });
  const latestHref = holdingsHref(allQuarters[allQuarters.length - 1]);

  if (!isQuarterSlug(quarter)) {
    return <NotFoundState latestHoldingsHref={latestHref} />;
  }

  const list = await dataSource.listProperties();
  const reporting = list.filter((p) => p.availableQuarters.includes(quarter));

  if (reporting.length === 0) {
    return (
      <EmptyState
        title={`No properties reported for ${quarterShortLabel(quarter)}`}
        message="Import a quarter to compare properties side by side."
      />
    );
  }

  const quarterLabels = allQuarters.map((q) => quarterShortLabel(q));

  const properties: CompareProperty[] = [];
  for (const p of reporting) {
    const report = await dataSource.getReport(
      { kind: "property", propertyId: p.propertyId },
      quarter,
    );
    if (!report) continue;

    // NOI and occupancy across every quarter, aligned to quarterLabels.
    const noiSeries: (number | null)[] = [];
    const occSeries: (number | null)[] = [];
    for (const q of allQuarters) {
      if (!p.availableQuarters.includes(q)) {
        noiSeries.push(null);
        occSeries.push(null);
        continue;
      }
      const r = await dataSource.getReport(
        { kind: "property", propertyId: p.propertyId },
        q,
      );
      noiSeries.push(r ? r.operatingStatement.netOperatingIncome.ptdCurrent : null);
      occSeries.push(r ? r.rentRoll.physicalOccupancy : null);
    }

    const ratios = computeRatios(report)
      .flatMap((g) => g.items)
      .map((i) => ({ key: i.key, label: i.label, value: i.value, format: i.format }));

    properties.push({
      propertyId: p.propertyId,
      tradeName: report.identity.kind === "property" ? report.identity.tradeName : p.tradeName,
      cityState: `${p.city}, ${p.state}`,
      units: report.rentRoll.totalUnits,
      totalIncome: report.operatingStatement.totalIncome.ptdCurrent,
      noi: report.operatingStatement.netOperatingIncome.ptdCurrent,
      physicalOccupancy: report.rentRoll.physicalOccupancy,
      economicOccupancy: report.rentRoll.economicOccupancy,
      vacantUnits: report.rentRoll.vacantUnits,
      ratios,
      noiSeries,
      occSeries,
    });
  }

  return (
    <CompareView
      quarter={quarter}
      quarterLabels={quarterLabels}
      properties={properties}
    />
  );
}
