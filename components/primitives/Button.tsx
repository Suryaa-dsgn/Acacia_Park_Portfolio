// components/primitives/Button.tsx
// Quiet button (DG 9.8). The product is link-and-table driven, so buttons are
// understated: 1px border, mono uppercase label, subtle press scale. A trailing
// arrow or icon can be passed as children. Press feedback is instant via :active.
import { cn } from "@/lib/cn";

export function Button({
  children,
  className,
  type = "button",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center gap-2 rounded-sm border border-hairline px-3.5 py-2",
        "font-mono text-label uppercase text-muted",
        "transition-[color,border-color,transform] duration-[120ms] ease-out",
        "hover:border-hairline-strong hover:text-text-serif active:scale-[0.985]",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-hairline disabled:hover:text-muted",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
