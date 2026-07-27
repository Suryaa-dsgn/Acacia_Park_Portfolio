"use client";
// app/(shell)/error.tsx
// Segment error boundary (IA section 4). A failed report render is caught here,
// so the shell (header, navigator, quarter selector) stays intact and only the
// main pane shows the error with a Retry. No stack traces reach the user.
import { useEffect } from "react";
import { ErrorState } from "@/components/states/ErrorState";

export default function ReportError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface for logs/telemetry; never shown to the user.
    console.error(error);
  }, [error]);

  return (
    <ErrorState
      message="The report could not be loaded. This does not affect the rest of the portal."
      onRetry={reset}
    />
  );
}
