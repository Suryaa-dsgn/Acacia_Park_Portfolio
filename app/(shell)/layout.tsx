import { dataSource } from "@/lib/dataSource";
import { AppShell } from "@/components/shell/AppShell";

// Shell layout (IA section 3). Fetches the navigator data server-side and wraps
// every report route in the app frame. The report itself is rendered by the
// child page and passed through as children.
export default async function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [properties, quarters] = await Promise.all([
    dataSource.listProperties(),
    dataSource.availableQuarters({ kind: "holding" }),
  ]);
  return (
    <AppShell properties={properties} quarters={quarters}>
      {children}
    </AppShell>
  );
}
