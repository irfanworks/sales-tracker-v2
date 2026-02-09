import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BdMonitoringTable } from "@/components/BdMonitoringTable";
import { BdMonitoringFilters } from "@/components/BdMonitoringFilters";
import { BarChart3 } from "lucide-react";

export default async function BdMonitoringPage({
  searchParams,
}: {
  searchParams: Promise<{ week_from?: string; week_to?: string; sales_id?: string; customer_id?: string }>;
}) {
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

  const params = await searchParams;
  const weekFrom = params.week_from ? parseInt(params.week_from, 10) : null;
  const weekTo = params.week_to ? parseInt(params.week_to, 10) : null;

  let query = supabase
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
    .eq("year", 2026);

  if (weekFrom != null && !isNaN(weekFrom)) query = query.gte("week_number", weekFrom);
  if (weekTo != null && !isNaN(weekTo)) query = query.lte("week_number", weekTo);
  if (params.sales_id) query = query.eq("user_id", params.sales_id);
  if (params.customer_id) query = query.eq("customer_id", params.customer_id);

  const { data: updates } = await query.order("week_number", { ascending: false });

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

  const { data: allSales } = await supabase
    .from("profiles")
    .select("id, display_name, full_name")
    .in("role", ["admin", "sales"])
    .order("display_name");
  const salesOptions = (allSales ?? []).map((p: { id: string; display_name: string | null; full_name: string | null }) => ({
    id: p.id,
    name: p.display_name ?? p.full_name ?? p.id.slice(0, 8),
  }));

  const { data: allCustomers } = await supabase
    .from("customers")
    .select("id, name")
    .order("name");
  const customerOptions = (allCustomers ?? []).map((c: { id: string; name: string }) => ({
    id: c.id,
    name: c.name,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-800">
          <BarChart3 className="h-7 w-7" />
          BD Monitoring
        </h1>
        <p className="mt-1 text-slate-600">
          Monitor weekly BD activity for all sales.
        </p>
      </div>
      <Suspense fallback={<div className="card animate-pulse p-4 h-24 bg-slate-100 rounded-xl" />}>
        <BdMonitoringFilters
          weekFrom={params.week_from}
          weekTo={params.week_to}
          salesId={params.sales_id}
          customerId={params.customer_id}
          salesOptions={salesOptions}
          customerOptions={customerOptions}
        />
      </Suspense>
      <div className="card overflow-hidden">
        <BdMonitoringTable
          updates={updates ?? []}
          salesNames={salesNames}
        />
      </div>
    </div>
  );
}
