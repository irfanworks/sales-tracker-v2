import { redirect } from "next/navigation";
import { getAuthUser, getProfile } from "@/lib/auth";
import { getCurrencyRates } from "@/lib/currency";
import { SettingsForm } from "@/components/SettingsForm";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";
import { Settings, User, Lock } from "lucide-react";

export default async function SettingsPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login?redirectTo=/dashboard/settings");
  }

  const [profile, currencyRates] = await Promise.all([getProfile(), getCurrencyRates()]);
  const isAdmin = profile?.role === "admin";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-800">
          <Settings className="h-7 w-7" />
          Settings
        </h1>
        <p className="mt-1 text-slate-600">Display name & password.</p>
      </div>

      <div className="card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-medium text-slate-800">
          <User className="h-5 w-5" />
          Display Name
        </h2>
        <p className="mb-4 text-sm text-slate-600">
          This name is displayed on the Dashboard (Sales column), Filter, and header.
        </p>
        <SettingsForm
          initialDisplayName={profile?.display_name ?? profile?.full_name ?? ""}
          userId={user.id}
          isAdmin={isAdmin}
          initialUsdPerIdr={currencyRates.usdPerIdr}
          initialSgdPerIdr={currencyRates.sgdPerIdr}
        />
      </div>

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
