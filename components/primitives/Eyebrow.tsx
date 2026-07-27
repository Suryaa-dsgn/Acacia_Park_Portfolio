// components/primitives/Eyebrow.tsx
// Mono, uppercase, accent-colored label that sits above every headline
// (DG 8.8). The teal-over-serif pairing is a core rhythm of the brand.
import { cn } from "@/lib/cn";

export function Eyebrow({
  children,
  className,
  as: Tag = "p",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "p" | "span" | "div";
}) {
  return (
    <Tag
      className={cn(
        "font-mono text-eyebrow uppercase text-accent",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
