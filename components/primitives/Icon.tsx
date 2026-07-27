// components/primitives/Icon.tsx
// A tiny, single line-icon set (DG 8.10). The reference is almost icon-free and
// that restraint is correct; icons appear only where the navigator needs them.
// One thin set, 1.5px stroke, currentColor, no fills, no duotone. Inline SVG so
// there is no icon-font or library dependency.
import { cn } from "@/lib/cn";

type IconName =
  | "building"
  | "grid"
  | "search"
  | "menu"
  | "close"
  | "chevronRight";

const PATHS: Record<IconName, React.ReactNode> = {
  building: (
    <>
      <path d="M3 21h18" />
      <path d="M6 21V5a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v16" />
      <path d="M15 21V9a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v12" />
      <path d="M9 7h.01M9 11h.01M9 15h.01" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </>
  ),
  menu: (
    <>
      <path d="M3 6h18M3 12h18M3 18h18" />
    </>
  ),
  close: (
    <>
      <path d="M18 6 6 18M6 6l12 12" />
    </>
  ),
  chevronRight: (
    <>
      <path d="m9 18 6-6-6-6" />
    </>
  ),
};

export function Icon({
  name,
  size = 16,
  className,
  title,
}: {
  name: IconName;
  size?: number;
  className?: string;
  title?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("shrink-0", className)}
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {PATHS[name]}
    </svg>
  );
}
