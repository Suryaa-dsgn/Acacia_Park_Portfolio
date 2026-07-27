// components/primitives/Link.tsx
// Inline link (DG 9.8): accent color, underline on hover, an optional trailing
// arrow for navigation. Wraps next/link so internal routes stay client-side.
import NextLink from "next/link";
import { cn } from "@/lib/cn";

export function Link({
  href,
  children,
  arrow,
  className,
}: {
  href: string;
  children: React.ReactNode;
  arrow?: boolean;
  className?: string;
}) {
  return (
    <NextLink
      href={href}
      className={cn(
        "inline-flex items-center gap-1 text-accent underline-offset-2 hover:underline",
        className,
      )}
    >
      {children}
      {arrow && <span aria-hidden>{"→"}</span>}
    </NextLink>
  );
}
