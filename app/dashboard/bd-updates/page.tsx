import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import { getSupabase } from "@/lib/auth";
import { BdUpdatesTable } from "@/components/BdUpdatesTable";
import { ClipboardList } from "lucide-react";

export default async function BdUpdatesPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const supabase = await getSupabase();
  const [{ data: updates }, { data: customers }] = await Promise.all([
    supabase
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
      .eq("user_id", user.id)
      .eq("year", 2026)
      .order("week_number", { ascending: false }),
    supabase.from("customers").select("id, name").order("name"),
  ]);

  const normalized = (updates ?? []).map((u) => ({
    ...u,
    customer: Array.isArray(u.customers) ? u.customers[0] : u.customers,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-800">
          <ClipboardList className="h-7 w-7" />
          BD Weekly Updates
        </h1>
        <p className="mt-1 text-slate-600">
          Update weekly Business Development activities per customer. Select week, customer, then fill in the description.
        </p>
      </div>
      <div className="card overflow-hidden p-4 sm:p-6">
        <BdUpdatesTable
          updates={normalized}
          userId={user.id}
          customers={customers ?? []}
        />
      </div>
    </div>
  );
}
