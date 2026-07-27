"use client";
// components/report/HoldingReportView.tsx
// The All Holdings roll-up report (report spec section 13). Shares the report
// skeleton with the single-property view but uses the portfolio header and
// replaces narrative and images with the Portfolio Composition block. The
// rolled-up KPIs, statement, rent roll, leasing, and occupancy trend reuse the
// same section components, driven by the aggregated report (DM 4.1).
import { motion, useReducedMotion } from "framer-motion";
import { revealContainer, revealItem, revealItemReduced } from "@/lib/motion";
import { HoldingHeader } from "./sections/HoldingHeader";
import { KpiRow } from "./sections/KpiRow";
import { OperatingStatement } from "./sections/OperatingStatement";
import { PerformanceVisuals } from "./sections/PerformanceVisuals";
import { RentRoll } from "./sections/RentRoll";
import { Leasing } from "./sections/Leasing";
import { OccupancyTrend } from "./sections/OccupancyTrend";
import { PortfolioComposition } from "./sections/PortfolioComposition";
import { AuditProvenance } from "./sections/AuditProvenance";
import type { QuarterlyReport } from "@/lib/types";

export function HoldingReportView({ report }: { report: QuarterlyReport }) {
  const reduced = useReducedMotion();
  const item = reduced ? revealItemReduced : revealItem;

  if (report.identity.kind !== "holding" || !report.composition) {
    return null;
  }

  const Section = ({ children }: { children: React.ReactNode }) => (
    <motion.section variants={item}>{children}</motion.section>
  );

  return (
    <motion.div
      variants={revealContainer}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-14"
    >
      <Section>
        <HoldingHeader identity={report.identity} meta={report.meta} />
      </Section>
      <Section>
        <KpiRow report={report} />
      </Section>
      <Section>
        <OperatingStatement report={report} />
      </Section>
      <Section>
        <PerformanceVisuals report={report} />
      </Section>
      <Section>
        <RentRoll report={report} />
      </Section>
      <Section>
        <Leasing report={report} />
      </Section>
      <Section>
        <OccupancyTrend report={report} />
      </Section>
      <Section>
        <PortfolioComposition
          properties={report.composition.properties}
          quarter={report.meta.quarter}
        />
      </Section>
      <Section>
        <AuditProvenance entries={report.provenance} />
      </Section>
    </motion.div>
  );
}
