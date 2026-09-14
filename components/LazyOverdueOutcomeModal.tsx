"use client";

import dynamic from "next/dynamic";
import type { OverdueOutcomePipeline } from "@/lib/overdueOutcome";

const OverdueOutcomeModal = dynamic(
  () =>
    import("@/components/OverdueOutcomeModal").then((m) => m.OverdueOutcomeModal),
  { ssr: false }
);

/** Code-split the overdue modal — only load when there is something to show. */
export function LazyOverdueOutcomeModal({
  count,
  items,
  isAdmin,
}: {
  count: number;
  items: OverdueOutcomePipeline[];
  isAdmin: boolean;
}) {
  if (count <= 0 || items.length === 0) return null;
  return <OverdueOutcomeModal count={count} items={items} isAdmin={isAdmin} />;
}
