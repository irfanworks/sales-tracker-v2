import { NextRequest, NextResponse } from "next/server";
import { format } from "date-fns";
import { getAuthUser, getProfile, getSupabase } from "@/lib/auth";
import { buildPipelinesListQuery, resolvePipelineSearchCustomerIds } from "@/lib/pipelinesQuery";
import { buildPipelinesWorkbook } from "@/lib/exportPipelinesServer";

/** Hard cap to protect DB + memory on wide filters. */
const EXPORT_PIPELINE_CAP = 2000;
const UPDATES_CHUNK = 200;

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getProfile();
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());

  if (profile?.role !== "admin") {
    params.sales_id = user.id;
  }

  const supabase = await getSupabase();
  const q = typeof params.q === "string" ? params.q : undefined;
  const searchCustomerIds = q ? await resolvePipelineSearchCustomerIds(supabase, q) : [];

  const { data: projectsRaw, error } = await buildPipelinesListQuery(supabase, params, {
    searchCustomerIds,
    range: { from: 0, to: EXPORT_PIPELINE_CAP - 1 },
  });
  if (error) {
    console.error("[export-pipelines]", error.message);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }

  const pipelines = projectsRaw ?? [];
  const pipelineIds = pipelines.map((p) => p.id);
  const salesIds = [...new Set(pipelines.map((p) => p.sales_id))];

  const updatesByPipeline: Record<string, Array<{ content: string; created_at: string }>> = {};

  const updateChunks: string[][] = [];
  for (let i = 0; i < pipelineIds.length; i += UPDATES_CHUNK) {
    updateChunks.push(pipelineIds.slice(i, i + UPDATES_CHUNK));
  }

  const [profilesResult, ...updateResults] = await Promise.all([
    salesIds.length > 0
      ? supabase.from("profiles").select("id, display_name, full_name").in("id", salesIds)
      : Promise.resolve({ data: [] as Array<{ id: string; display_name: string | null; full_name: string | null }> }),
    ...updateChunks.map((chunk) =>
      supabase
        .from("pipeline_updates")
        .select("pipeline_id, content, created_at")
        .in("pipeline_id", chunk)
        .order("created_at", { ascending: true })
    ),
  ]);

  for (const result of updateResults) {
    (result.data ?? []).forEach((u: { pipeline_id: string; content: string; created_at: string }) => {
      if (!updatesByPipeline[u.pipeline_id]) updatesByPipeline[u.pipeline_id] = [];
      updatesByPipeline[u.pipeline_id].push({ content: u.content, created_at: u.created_at });
    });
  }

  const salesNames: Record<string, string> = {};
  (profilesResult.data ?? []).forEach((p) => {
    salesNames[p.id] = p.display_name ?? p.full_name ?? "";
  });

  const rows = pipelines.map((p) => {
    const customer = Array.isArray(p.customers) ? p.customers[0] : p.customers;
    return {
      no_quote: p.no_quote,
      pipeline_name: p.pipeline_name,
      customer_name: customer?.name ?? "",
      pic_name: p.pic_name ?? null,
      value: p.value != null ? Number(p.value) : 0,
      pipeline_type: p.pipeline_type ?? "Project",
      sales_stage: p.sales_stage,
      sales_stage_changed_at: p.sales_stage_changed_at ?? null,
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
      "Cache-Control": "private, no-store",
    },
  });
}
