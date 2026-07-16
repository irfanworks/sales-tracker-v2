import { redirect } from "next/navigation";
import { getAuthUser, getProfile, getTeamTargetProfiles } from "@/lib/auth";
import { getCurrencyRates } from "@/lib/currency";
import { SettingsForm } from "@/components/SettingsForm";
import { AdminTeamTargetsForm } from "@/components/AdminTeamTargetsForm";
import { AdminUsersManager } from "@/components/AdminUsersManager";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";
import { Settings, User, Lock, Target, Users } from "lucide-react";

export default async function SettingsPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login?redirectTo=/dashboard/settings");
  }

  const [profile, currencyRates] = await Promise.all([getProfile(), getCurrencyRates()]);
  const isAdmin = profile?.role === "admin";
  const teamMembers = isAdmin ? await getTeamTargetProfiles() : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-800">
          <Settings className="h-7 w-7" />
          Settings
        </h1>
        <p className="mt-1 text-slate-600">
          Display name, annual sales target
          {isAdmin ? ", user accounts, team targets, currency" : ""}, and password.
        </p>
      </div>

      <div className="card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-medium text-slate-800">
          <User className="h-5 w-5" />
          Profile &amp; personal target
        </h2>
        <p className="mb-4 text-sm text-slate-600">
          Your display name and personal annual sales target (used when viewing your own dashboard).
        </p>
        <SettingsForm
          initialDisplayName={profile?.display_name ?? profile?.full_name ?? ""}
          userId={user.id}
          isAdmin={isAdmin}
          initialUsdPerIdr={currencyRates.usdPerIdr}
          initialSgdPerIdr={currencyRates.sgdPerIdr}
          initialAnnualSalesTarget={
            profile?.annual_sales_target != null ? Number(profile.annual_sales_target) : null
          }
        />
      </div>

      {isAdmin && (
        <div className="card p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-medium text-slate-800">
            <Users className="h-5 w-5" />
            User management
          </h2>
          <AdminUsersManager users={teamMembers} currentUserId={user.id} />
        </div>
      )}

      {isAdmin && (
        <div className="card p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-medium text-slate-800">
            <Target className="h-5 w-5" />
            Team annual sales targets
          </h2>
          <AdminTeamTargetsForm members={teamMembers} />
        </div>
      )}

      <div className="card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-medium text-slate-800">
          <Lock className="h-5 w-5" />
          Change Password
        </h2>
        <p className="mb-4 text-sm text-slate-600">
          Enter your new password and confirmation.
        </p>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
