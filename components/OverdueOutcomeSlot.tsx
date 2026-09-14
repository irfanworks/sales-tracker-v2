import { LazyOverdueOutcomeModal } from "@/components/LazyOverdueOutcomeModal";
import { getOverdueWithoutOutcome } from "@/lib/overdueOutcome";

/**
 * Isolated async slot so dashboard page content can stream without waiting
 * on the overdue-outcome query that runs in the layout shell.
 */
export async function OverdueOutcomeSlot() {
  const overdue = await getOverdueWithoutOutcome(8);
  return (
    <LazyOverdueOutcomeModal
      count={overdue.count}
      items={overdue.items}
      isAdmin={overdue.isAdmin}
    />
  );
}
