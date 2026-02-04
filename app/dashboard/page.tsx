import { createClient } from "@/lib/supabase/server";
import { ProjectsTable } from "@/components/ProjectsTable";
import { DashboardMetrics } from "@/components/DashboardMetrics";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: projectsRaw, error } = await supabase
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

  // Total Value Win: sum value where progress_type = Win (abaikan Lose)
  const totalValueWin = projects
    .filter((p: { progress_type: string }) => p.progress_type === "Win")
    .reduce((sum: number, p: { value: unknown }) => sum + Number(p.value ?? 0), 0);

  // Total Value Hot Leads: sum value where prospect = Hot Prospect dan bukan Lose
  const totalValueHotLeads = projects
    .filter(
      (p: { prospect: string; progress_type: string }) =>
        p.prospect === "Hot Prospect" && p.progress_type !== "Lose"
    )
    .reduce((sum: number, p: { value: unknown }) => sum + Number(p.value ?? 0), 0);

  const totalProjects = projects.length;
  const totalBudgetary = projects.filter((p: { progress_type: string }) => p.progress_type === "Budgetary").length;
  const totalTender = projects.filter((p: { progress_type: string }) => p.progress_type === "Tender").length;
  const totalHotProspect = projects.filter((p: { prospect: string }) => p.prospect === "Hot Prospect").length;

  // Total Value Project: sum value of all projects except Lose
  const totalValueProject = projects
    .filter((p: { progress_type: string }) => p.progress_type !== "Lose")
    .reduce((sum: number, p: { value: unknown }) => sum + Number(p.value ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Dashboard</h1>
        <p className="mt-1 text-slate-600">Overview of all projects.</p>
      </div>
      <DashboardMetrics
        totalValueProject={totalValueProject}
        totalValueWin={totalValueWin}
        totalValueHotLeads={totalValueHotLeads}
        totalProjects={totalProjects}
        totalBudgetary={totalBudgetary}
        totalTender={totalTender}
        totalHotProspect={totalHotProspect}
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
