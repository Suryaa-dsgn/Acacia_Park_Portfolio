// components/states/EmptyState.tsx
// A calm centered block for a valid scope and quarter that has no data yet
// (IA section 4). Mono eyebrow, serif line, one plain sentence. No error tone.
import { Eyebrow } from "@/components/primitives/Eyebrow";

export function EmptyState({
  eyebrow = "Not yet available",
  title,
  message,
}: {
  eyebrow?: string;
  title: string;
  message: string;
}) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center px-6 text-center">
      <Eyebrow className="mb-3">{eyebrow}</Eyebrow>
      <p className="font-serif text-title text-text-serif">{title}</p>
      <p className="mt-2 max-w-md font-sans text-body text-muted">{message}</p>
    </div>
  );
}
