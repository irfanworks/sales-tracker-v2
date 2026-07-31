import { Suspense } from "react";
import Link from "next/link";
import { getAuthUser, getProfile, getSalesOptions, getSupabase } from "@/lib/auth";
import { ProspectsTable } from "@/components/ProspectsTable";
import { ProspectsFilters } from "@/components/ProspectsFilters";
import { PageHeader } from "@/components/ui/PageHeader";
import { PlusCircle, Target } from "lucide-react";
import type { ProspectStatus } from "@/lib/types/database";

export default async function ProspectsListPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; sales_id?: string; page?: string }>;
}) {
  const rawParams = await searchParams;
  const user = await getAuthUser();
  const profile = await getProfile();
  const isAdmin = profile?.role === "admin";

  const status = rawParams.status;
  const salesId = !isAdmin && user ? user.id : rawParams.sales_id;

  const supabase = await getSupabase();
  let query = supabase
    .from("prospects")
    .select(
      `
      id,
      created_at,
      title,
      work_description,
      pic_name,
      status,
      latest_update,
      sales_id,
      customers ( id, name, slug )
    `
    )
    .order("updated_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (salesId) query = query.eq("sales_id", salesId);

  const [salesOptions, listResult] = await Promise.all([getSalesOptions(), query]);
  const { data: rows, error } = listResult;

  if (error) {
    return (
      <div className="card p-6">
        <p className="text-red-600">Error loading prospects: {error.message}</p>
        <p className="mt-2 text-sm text-slate-500">
          If this is a new install, run migration{" "}
          <code className="rounded bg-slate-100 px-1">027_remove_bd_add_prospects.sql</code> in
          Supabase.
        </p>
      </div>
    );
  }

  const prospects = rows ?? [];
  const salesIds = [...new Set(prospects.map((p) => p.sales_id))];
  const salesNames: Record<string, string> = {};

  if (salesIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, full_name")
      .in("id", salesIds);
    (profiles ?? []).forEach((p) => {
      salesNames[p.id] = p.display_name ?? p.full_name ?? "";
    });
  }

  const prospectsWithSales = prospects.map((p) => ({
    id: p.id,
    created_at: p.created_at,
    title: p.title,
    work_description: p.work_description,
    pic_name: p.pic_name,
    status: p.status as ProspectStatus,
    latest_update: p.latest_update,
    sales_id: p.sales_id,
    customer: Array.isArray(p.customers) ? p.customers[0] : p.customers,
    sales_name: salesNames[p.sales_id] ?? null,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Target}
        title="Prospect"
        description={
          isAdmin
            ? "Pre-quote opportunities — customer, work, and sales activity before a quote exists."
            : "Your pre-quote opportunities — capture customer, work, and progress updates."
        }
        actions={
          <Link href="/dashboard/prospects/new" className="btn-primary gap-2">
            <PlusCircle className="h-4 w-4" />
            New Prospect
          </Link>
        }
      />
      <Suspense fallback={<div className="card shimmer h-24 rounded-2xl" />}>
        <ProspectsFilters
          status={rawParams.status}
          salesId={isAdmin ? rawParams.sales_id : undefined}
          salesOptions={salesOptions}
          showSalesFilter={isAdmin}
        />
      </Suspense>
      <div className="table-shell">
        <ProspectsTable
          prospects={prospectsWithSales}
          showSales={isAdmin}
          emptyMessage="No prospects yet."
        />
      </div>
    </div>
  );
}
