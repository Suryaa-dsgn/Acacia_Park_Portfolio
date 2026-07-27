// components/shell/Footer.tsx
// Full-width footer (IA section 3, DG 9.1). A single mono caption in faint ink:
// the governed data-source line. Middot separators are fine; no em dash.
export function Footer() {
  return (
    <footer className="border-t border-hairline bg-surface">
      <div className="mx-auto max-w-container px-[clamp(16px,4vw,48px)] py-4">
        <p className="font-mono text-caption text-faint">
          Governed from Yardi Voyager quarterly exports · Cash basis · 5 quarters
          retained
        </p>
      </div>
    </footer>
  );
}
