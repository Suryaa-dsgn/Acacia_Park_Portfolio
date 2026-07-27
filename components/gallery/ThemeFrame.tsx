// components/gallery/ThemeFrame.tsx
// Dev-only helper for the primitives gallery. Forces a theme on a subtree by
// setting data-theme locally, so dark and light can be shown side by side on
// one page. The token layer keys entirely off data-theme, so nested overrides
// resolve correctly.
export function ThemeFrame({
  theme,
  children,
}: {
  theme: "dark" | "light";
  children: React.ReactNode;
}) {
  return (
    <div
      data-theme={theme}
      className="flex-1 rounded-md border border-hairline bg-bg p-6"
    >
      <p className="mb-4 font-mono text-eyebrow uppercase tracking-[0.14em] text-faint">
        {theme}
      </p>
      {children}
    </div>
  );
}
