"use client";
// components/report/QuarterlyReportView.tsx
// The single-property Quarterly Report (report spec sections 2-11). Composes the
// sections in order and reveals them once on load with a short staggered rise
// (DG 7.3), collapsing to an opacity cross-fade under reduced motion. Each
// section is a pure server-composable block; this client wrapper owns only the
// reveal. The holding variant is built in the next phase.
import { motion, useReducedMotion } from "framer-motion";
import { revealContainer, revealItem, revealItemReduced } from "@/lib/motion";
import { ReportHeader } from "./sections/ReportHeader";
import { Financials } from "./sections/Financials";
import { Narrative } from "./sections/Narrative";
import { PropertyImages } from "./sections/PropertyImages";
import { AuditProvenance } from "./sections/AuditProvenance";
import type { QuarterlyReport } from "@/lib/types";

export function QuarterlyReportView({ report }: { report: QuarterlyReport }) {
  const reduced = useReducedMotion();
  const item = reduced ? revealItemReduced : revealItem;

  if (report.identity.kind !== "property") {
    // The property route always supplies a property-scoped report; the holding
    // variant is rendered by its own view in a later phase.
    return null;
  }

  const propertyId =
    report.scope.kind === "property" ? report.scope.propertyId : "";

  const Section = ({ children }: { children: React.ReactNode }) => (
    <motion.section variants={item}>{children}</motion.section>
  );

  return (
    <motion.div
      variants={revealContainer}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-10"
    >
      <Section>
        <ReportHeader
          identity={report.identity}
          meta={report.meta}
          propertyId={
            report.scope.kind === "property" ? report.scope.propertyId : ""
          }
        />
      </Section>
      <Section>
        <Financials report={report} />
      </Section>
      {report.narrative && (
        <Section>
          <Narrative
            sections={report.narrative}
            propertyId={propertyId}
            quarter={report.meta.quarter}
          />
        </Section>
      )}
      {report.images && (
        <Section>
          <PropertyImages
            images={report.images}
            propertyId={propertyId}
            quarter={report.meta.quarter}
          />
        </Section>
      )}
      <Section>
        <AuditProvenance entries={report.provenance} />
      </Section>
    </motion.div>
  );
}
