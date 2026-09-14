import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getAuthUser, getProfile } from "@/lib/auth";
import { DashboardShell } from "@/components/DashboardShell";
import { OverdueOutcomeSlot } from "@/components/OverdueOutcomeSlot";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, profile] = await Promise.all([getAuthUser(), getProfile()]);
  if (!user) {
    redirect("/login?redirectTo=/dashboard");
  }

  return (
    <DashboardShell user={user} profile={profile}>
      <Suspense fallback={null}>
        <OverdueOutcomeSlot />
      </Suspense>
      {children}
    </DashboardShell>
  );
}
