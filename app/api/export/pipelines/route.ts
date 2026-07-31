import { NextRequest, NextResponse } from "next/server";
import { format } from "date-fns";
import { getAuthUser, getProfile, getSupabase } from "@/lib/auth";
import { buildPipelinesListQuery } from "@/lib/pipelinesQuery";
import { buildPipelinesWorkbook } from "@/lib/exportPipelinesServer";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getProfile();
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());

  // Non-admins can only export their own pipelines
  if (profile?.role !== "admin") {
    params.sales_id = user.id;
  }

  const supabase = await getSupabase();

  const { data: projectsRaw, error } = await buildPipelinesListQuery(supabase, params);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const pipelines = projectsRaw ?? [];
  const pipelineIds = pipelines.map((p) => p.id);
  const salesIds = [...new Set(pipelines.map((p) => p.sales_id))];

  const [{ data: allUpdates }, { data: profiles }] = await Promise.all([
    pipelineIds.length > 0
      ? supabase
          .from("pipeline_updates")
          .select("pipeline_id, content, created_at")
          .in("pipeline_id", pipelineIds)
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

  const updatesByPipeline: Record<string, Array<{ content: string; created_at: string }>> = {};
  (allUpdates ?? []).forEach((u) => {
    if (!updatesByPipeline[u.pipeline_id]) updatesByPipeline[u.pipeline_id] = [];
    updatesByPipeline[u.pipeline_id].push({ content: u.content, created_at: u.created_at });
  });

  const rows = pipelines.map((p) => {
    const customer = Array.isArray(p.customers) ? p.customers[0] : p.customers;
    return {
      no_quote: p.no_quote,
      pipeline_name: p.pipeline_name,
      customer_name: customer?.name ?? "",
      pic_name: p.pic_name ?? null,
      value: p.value != null ? Number(p.value) : 0,
      progress_type: p.progress_type,
      pipeline_type: p.pipeline_type ?? "Project",
      outcome_status: p.outcome_status ?? null,
      prospect: p.prospect,
      sales_name: salesNames[p.sales_id] ?? "",
      date: format(new Date(p.created_at), "dd MMM yyyy"),
      target_closing_at: p.target_closing_at ?? null,
      status: p.status ?? "Open",
      updates: updatesByPipeline[p.id] ?? [],
    };
  });

  const buffer = buildPipelinesWorkbook(rows);
  const filename = `pipeline-export-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
