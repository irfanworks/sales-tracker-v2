"use client";

import { OverdueOutcomeModal } from "@/components/OverdueOutcomeModal";
import type { OverdueOutcomePipeline } from "@/lib/overdueOutcome";

/** Keep modal out of the critical server HTML when there is nothing overdue. */
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
