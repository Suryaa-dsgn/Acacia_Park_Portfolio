// components/states/NotFoundState.tsx
// Bad route inside the shell (IA section 4): the shell stays, the main pane
// shows a centered line and a link back to the latest All Holdings report.
import { Link } from "@/components/primitives/Link";

export function NotFoundState({
  latestHoldingsHref,
  message = "That report does not exist.",
}: {
  latestHoldingsHref: string;
  message?: string;
}) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center px-6 text-center">
      <p className="font-serif text-title text-text-serif">{message}</p>
      <Link href={latestHoldingsHref} arrow className="mt-3 font-mono text-caption">
        Back to the latest All Holdings report
      </Link>
    </div>
  );
}
