import { redirect } from "next/navigation";
import { getAuthUser, getProfile } from "@/lib/auth";
import { DashboardShell } from "@/components/DashboardShell";
import { LazyOverdueOutcomeModal } from "@/components/LazyOverdueOutcomeModal";
import { getOverdueWithoutOutcome } from "@/lib/overdueOutcome";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login?redirectTo=/dashboard");
  }

  const [profile, overdue] = await Promise.all([
    getProfile(),
    getOverdueWithoutOutcome(8),
  ]);

  return (
    <DashboardShell user={user} profile={profile}>
      <LazyOverdueOutcomeModal
        count={overdue.count}
        items={overdue.items}
        isAdmin={overdue.isAdmin}
      />
      {children}
    </DashboardShell>
  );
}
