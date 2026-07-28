// components/primitives/Panel.tsx
// The section container (DG 9.3, report spec section 1). Background panel, 1px
// border, radius md, generous padding. Light mode adds a soft resting shadow.
// Optional mono eyebrow + serif title + one-line muted description, with an
// optional right-aligned control (a link, a segmented toggle).
import { cn } from "@/lib/cn";
import { Eyebrow } from "./Eyebrow";

export function Panel({
  eyebrow,
  title,
  description,
  action,
  children,
  className,
  as: Tag = "section",
}: {
  eyebrow?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  as?: "section" | "div" | "article";
}) {
  const hasHeader = eyebrow || title || description || action;
  return (
    <Tag
      className={cn(
        // dark mode is near flat (borders only); light-mode shadow is applied
        // to .panel in base.css so resting dark surfaces stay shadowless (DG 6).
        "panel rounded-md border border-hairline bg-panel p-5 md:p-6",
        className,
      )}
    >
      {hasHeader && (
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            {eyebrow && <Eyebrow className="mb-1.5">{eyebrow}</Eyebrow>}
            {title && (
              <h2 className="font-serif text-title font-semibold text-text-serif">{title}</h2>
            )}
            {description && (
              <p className="mt-1.5 max-w-prose font-sans text-body text-muted">
                {description}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </Tag>
  );
}
