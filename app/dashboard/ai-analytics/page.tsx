import { redirect } from "next/navigation";
import { Bot, ShieldAlert } from "lucide-react";
import { getAuthUser, getProfile } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { AiExecutiveAssistant } from "@/components/ai/AiExecutiveAssistant";

export const dynamic = "force-dynamic";

export default async function AiAnalyticsPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login?redirectTo=/dashboard/ai-analytics");
  }

  const profile = await getProfile();
  const isAdmin = profile?.role === "admin";

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        icon={Bot}
        title="AI Analytics"
        description="Executive assistant untuk performa sales, tren omzet, forecast, dan keputusan strategis."
      />

      {isAdmin ? (
        <AiExecutiveAssistant />
      ) : (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-10 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 ring-1 ring-amber-200">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-amber-950">
            Access Denied: Fitur ini hanya untuk Admin
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-amber-900/80">
            AI Business Executive Assistant menyajikan insight lintas tim dan forecast perusahaan.
            Hubungi admin jika Anda membutuhkan akses.
          </p>
        </div>
      )}
    </div>
  );
}
