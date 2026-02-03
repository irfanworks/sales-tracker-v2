import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BdMonitoringTable } from "@/components/BdMonitoringTable";
import { BarChart3 } from "lucide-react";

export default async function BdMonitoringPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  const { data: updates } = await supabase
    .from("bd_weekly_updates")
    .select(`
      id,
      user_id,
      year,
      week_number,
      customer_id,
      content,
      created_at,
      updated_at,
      customers ( id, name )
    `)
    .eq("year", 2026)
    .order("week_number", { ascending: false });

  const userIds = [...new Set((updates ?? []).map((u) => u.user_id))];
  const { data: salesProfiles } = userIds.length > 0
    ? await supabase
        .from("profiles")
        .select("id, display_name, full_name, email")
        .in("id", userIds)
    : { data: [] };
  const salesNames: Record<string, string> = {};
  (salesProfiles ?? []).forEach((p: { id: string; display_name: string | null; full_name: string | null }) => {
    salesNames[p.id] = p.display_name ?? p.full_name ?? p.id.slice(0, 8);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-800">
          <BarChart3 className="h-7 w-7" />
          BD Monitoring
        </h1>
        <p className="mt-1 text-slate-600">
          Pantau weekly BD activity seluruh sales.
        </p>
      </div>
      <div className="card overflow-hidden">
        <BdMonitoringTable
          updates={updates ?? []}
          salesNames={salesNames}
        />
      </div>
    </div>
  );
}
