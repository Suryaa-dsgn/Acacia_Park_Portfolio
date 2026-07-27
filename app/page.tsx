import { redirect } from "next/navigation";
import { dataSource } from "@/lib/dataSource";
import { holdingsHref } from "@/lib/nav";

// Root redirects to the latest quarter's All Holdings report (IA section 2).
export default async function Home() {
  const quarters = await dataSource.availableQuarters({ kind: "holding" });
  const latest = quarters[quarters.length - 1];
  redirect(holdingsHref(latest));
}
