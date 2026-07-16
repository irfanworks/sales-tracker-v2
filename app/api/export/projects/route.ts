import { NextRequest, NextResponse } from "next/server";
import { format } from "date-fns";
import { getAuthUser, getProfile, getSupabase } from "@/lib/auth";
import { buildProjectsListQuery } from "@/lib/projectsQuery";
import { buildProjectsWorkbook } from "@/lib/exportProjectsServer";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getProfile();
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const scope = params.scope === "bd" ? "bd" : "projects";

  // Non-admins can only export their own projects
  if (profile?.role !== "admin") {
    params.sales_id = user.id;
  }

  const supabase = await getSupabase();

  const { data: projectsRaw, error } = await buildProjectsListQuery(supabase, params, { scope });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const projects = projectsRaw ?? [];
  const projectIds = projects.map((p) => p.id);
  const salesIds = [...new Set(projects.map((p) => p.sales_id))];

  const [{ data: allUpdates }, { data: profiles }] = await Promise.all([
    projectIds.length > 0
      ? supabase
          .from("project_updates")
          .select("project_id, content, created_at")
          .in("project_id", projectIds)
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [] }),
    salesIds.length > 0
      ? supabase.from("profiles").select("id, display_name, full_name").in("id", salesIds)
      : Promise.resolve({ data: [] }),
  ]);

  const salesNames: Record<string, string> = {};
  (profiles ?? []).forEach((p) => {
    salesNames[p.id] = p.display_name ?? p.full_name ?? "";
  });

  const updatesByProject: Record<string, Array<{ content: string; created_at: string }>> = {};
  (allUpdates ?? []).forEach((u) => {
    if (!updatesByProject[u.project_id]) updatesByProject[u.project_id] = [];
    updatesByProject[u.project_id].push({ content: u.content, created_at: u.created_at });
  });

  const rows = projects.map((p) => {
    const customer = Array.isArray(p.customers) ? p.customers[0] : p.customers;
    return {
      no_quote: p.no_quote,
      project_name: p.project_name,
      customer_name: customer?.name ?? "",
      pic_name: p.pic_name ?? null,
      value: p.value != null ? Number(p.value) : 0,
      progress_type: p.progress_type,
      project_type: p.project_type ?? "Project",
      outcome_status: p.outcome_status ?? null,
      prospect: p.prospect,
      sales_name: salesNames[p.sales_id] ?? "",
      date: format(new Date(p.created_at), "dd MMM yyyy"),
      target_closing_at: p.target_closing_at ?? null,
      status: p.status ?? "Open",
      updates: updatesByProject[p.id] ?? [],
    };
  });

  const buffer = buildProjectsWorkbook(rows);
  const filename =
    scope === "bd"
      ? `bd-projects-export-${new Date().toISOString().slice(0, 10)}.xlsx`
      : `projects-export-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
