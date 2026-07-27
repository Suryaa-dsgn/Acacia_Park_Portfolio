// components/primitives/StatusTag.tsx
// Small mono uppercase pills (DG 8.9, 9.9). Two families: narrative authoring
// status (Completed, Work in Progress, Gathering Info, Not Started) and generic
// health/action tags. Color is always paired with the label text, never color
// alone (DG 3.6, accessibility).
import { cn } from "@/lib/cn";

export type StatusVariant =
  | "completed"
  | "in-progress"
  | "gathering"
  | "not-started"
  | "pos"
  | "warn"
  | "info"
  | "action"
  | "neutral";

const VARIANT: Record<
  StatusVariant,
  { bg: string; fg: string; label?: string }
> = {
  completed: { bg: "var(--color-pos-soft)", fg: "var(--color-pos)", label: "Completed" },
  "in-progress": { bg: "var(--color-warn-soft)", fg: "var(--color-warn)", label: "Work in Progress" },
  gathering: { bg: "var(--color-info-soft)", fg: "var(--color-info)", label: "Gathering Info" },
  "not-started": { bg: "transparent", fg: "var(--color-text-faint)", label: "Not Started" },
  pos: { bg: "var(--color-pos-soft)", fg: "var(--color-pos)" },
  warn: { bg: "var(--color-warn-soft)", fg: "var(--color-warn)" },
  info: { bg: "var(--color-info-soft)", fg: "var(--color-info)" },
  action: { bg: "transparent", fg: "var(--color-accent)" },
  neutral: { bg: "transparent", fg: "var(--color-text-faint)" },
};

export function StatusTag({
  variant,
  children,
  className,
}: {
  variant: StatusVariant;
  children?: React.ReactNode;
  className?: string;
}) {
  const v = VARIANT[variant];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill px-2.5 py-1 font-mono text-[0.6875rem] uppercase tracking-[0.1em]",
        className,
      )}
      style={{ background: v.bg, color: v.fg }}
    >
      {children ?? v.label}
    </span>
  );
}
