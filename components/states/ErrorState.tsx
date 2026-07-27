"use client";
// components/states/ErrorState.tsx
// A bordered block for a load failure (IA section 4). Mono COULD NOT LOAD, one
// plain sentence, a quiet Retry. No stack traces. Errors never take over the
// whole shell, only the affected pane.
import { Button } from "@/components/primitives/Button";

export function ErrorState({
  message = "The report could not be loaded.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-6">
      <div className="max-w-md rounded-md border border-hairline-strong bg-panel p-6 text-center">
        <p className="font-mono text-label uppercase tracking-[0.1em] text-neg">
          Could not load
        </p>
        <p className="mt-2 font-sans text-body text-muted">{message}</p>
        {onRetry && (
          <div className="mt-4 flex justify-center">
            <Button onClick={onRetry}>Retry</Button>
          </div>
        )}
      </div>
    </div>
  );
}
