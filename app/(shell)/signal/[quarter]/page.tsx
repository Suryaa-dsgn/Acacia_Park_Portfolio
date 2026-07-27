import { dataSource } from "@/lib/dataSource";
import { isQuarterSlug, quarterShortLabel } from "@/lib/quarter";
import { holdingsHref } from "@/lib/nav";
import { MONTH_ABBR } from "@/lib/report";
import { SignalView, type SignalProperty } from "@/components/report/SignalView";
import { EmptyState } from "@/components/states/EmptyState";
import { NotFoundState } from "@/components/states/NotFoundState";

// Portfolio Signal: an illustrative forecast surface. Server-fetches each
// reporting property's current-quarter figures and occupancy series; the model
// itself runs client-side (lib/forecast) so the horizon and shock controls
// recompute live.
export default async function SignalPage({
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
        message="Import a quarter to see the portfolio signal."
      />
    );
  }

  const properties: SignalProperty[] = [];
  for (const p of reporting) {
    const report = await dataSource.getReport(
      { kind: "property", propertyId: p.propertyId },
      quarter,
    );
    if (!report) continue;
    const os = report.operatingStatement;
    const rr = report.rentRoll;
    const l = report.leasing;
    properties.push({
      propertyId: p.propertyId,
      tradeName: report.identity.kind === "property" ? report.identity.tradeName : p.tradeName,
      cityState: `${p.city}, ${p.state}`,
      units: rr.totalUnits,
      noi: os.netOperatingIncome.ptdCurrent,
      totalIncome: os.totalIncome.ptdCurrent,
      opex: os.totalOperatingExpenses.ptdCurrent,
      physicalOccupancy: rr.physicalOccupancy,
      economicOccupancy: rr.economicOccupancy,
      occupiedUnits: rr.occupiedUnits,
      vacantUnits: rr.vacantUnits,
      totalInPlaceRent: rr.totalInPlaceRent,
      totalMarketRent: rr.totalMarketRent,
      occupancyCurrent: report.occupancySeries.current,
      noticesToVacate: l ? l.noticesToVacate : null,
      unitsRented: l ? l.unitsRented : null,
      renewals: l ? l.renewals : null,
      netAbsorption: l ? l.netAbsorption : null,
    });
  }

  return (
    <SignalView
      quarterLabel={quarterShortLabel(quarter)}
      monthLabels={MONTH_ABBR}
      properties={properties}
    />
  );
}
