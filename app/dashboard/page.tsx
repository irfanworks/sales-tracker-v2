import { createClient } from "@/lib/supabase/server";
import { ProjectsTable } from "@/components/ProjectsTable";
import { ProjectsFilters } from "@/components/ProjectsFilters";
import { DashboardMetrics } from "@/components/DashboardMetrics";
import { ExportProjectsButton } from "@/components/ExportProjectsButton";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ progress_type?: string; prospect?: string; sales_id?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;

  let query = supabase
    .from("projects")
    .select(`
      id,
      created_at,
      no_quote,
      project_name,
      customer_id,
      value,
      progress_type,
      prospect,
      weekly_update,
      sales_id,
      customers ( id, name )
    `)
    .order("created_at", { ascending: false });

  if (params.progress_type) {
    query = query.eq("progress_type", params.progress_type);
  }
  if (params.prospect) {
    query = query.eq("prospect", params.prospect);
  }
  if (params.sales_id) {
    query = query.eq("sales_id", params.sales_id);
  }

  const { data: projectsRaw, error } = await query;
  const projects = projectsRaw ?? [];
  const salesIds = [...new Set(projects.map((p: { sales_id: string }) => p.sales_id))];
  const salesNames: Record<string, string> = {};
  if (salesIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, full_name")
      .in("id", salesIds);
    (profiles ?? []).forEach((p: { id: string; display_name: string | null; full_name: string | null }) => {
      salesNames[p.id] = p.display_name ?? p.full_name ?? "";
    });
  }

  if (error) {
    return (
      <div className="card p-6">
        <p className="text-red-600">Error loading projects: {error.message}</p>
      </div>
    );
  }

  const projectsWithSales = projects.map((p: Record<string, unknown>) => ({
    ...p,
    sales_name: salesNames[(p.sales_id as string) ?? ""] ?? null,
  }));

  const { data: salesOptions } = await supabase
    .from("profiles")
    .select("id, display_name, full_name")
    .in("role", ["admin", "sales"])
    .order("display_name");

  const displaySalesOptions = (salesOptions ?? []).map((s: { id: string; display_name: string | null; full_name: string | null }) => ({
    id: s.id,
    display_name: s.display_name ?? s.full_name ?? s.id.slice(0, 8),
  }));

  const totalValue = projects.reduce((sum: number, p: { value: unknown }) => sum + Number(p.value ?? 0), 0);
  const totalCount = projects.length;
  const hotCount = projects.filter((p: { prospect: string }) => p.prospect === "Hot Prospect").length;
  const hotWinCount = projects.filter((p: { prospect: string; progress_type: string }) => p.prospect === "Hot Prospect" && p.progress_type === "Win").length;
  const hotWinPct = hotCount > 0 ? Math.round((hotWinCount / hotCount) * 100) : null;
  const winCount = projects.filter((p: { progress_type: string }) => p.progress_type === "Win").length;
  const loseCount = projects.filter((p: { progress_type: string }) => p.progress_type === "Lose").length;

  const exportProjects = projectsWithSales.map((p: Record<string, unknown>) => ({
    id: p.id,
    created_at: p.created_at,
    no_quote: p.no_quote,
    project_name: p.project_name,
    value: Number(p.value),
    progress_type: p.progress_type,
    prospect: p.prospect,
    sales_name: p.sales_name ?? null,
    customer: Array.isArray(p.customers) ? p.customers[0] : p.customers,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Dashboard</h1>
          <p className="mt-1 text-slate-600">Overview of all projects.</p>
        </div>
        <ExportProjectsButton projects={exportProjects} />
      </div>
      <ProjectsFilters
        progressType={params.progress_type}
        prospect={params.prospect}
        salesId={params.sales_id}
        salesOptions={displaySalesOptions}
      />
      <DashboardMetrics
        totalValue={totalValue}
        totalCount={totalCount}
        hotCount={hotCount}
        hotWinCount={hotWinCount}
        hotWinPct={hotWinPct}
        winCount={winCount}
        loseCount={loseCount}
      />
      <div className="card overflow-hidden">
        <ProjectsTable
          projects={
            projectsWithSales.map((p: Record<string, unknown>) => ({
              id: p.id,
              created_at: p.created_at,
              no_quote: p.no_quote,
              project_name: p.project_name,
              customer_id: p.customer_id,
              value: Number(p.value),
              progress_type: p.progress_type,
              prospect: p.prospect,
              weekly_update: p.weekly_update,
              sales_id: p.sales_id,
              customer: Array.isArray(p.customers) ? p.customers[0] : p.customers,
              sales_name: p.sales_name ?? null,
            })) as Array<{
              id: string;
              created_at: string;
              no_quote: string;
              project_name: string;
              customer_id: string;
              value: number;
              progress_type: string;
              prospect: string;
              weekly_update: string | null;
              sales_id: string;
              customer?: { id: string; name: string };
              sales_name?: string | null;
            }>
          }
        />
      </div>
    </div>
  );
}
