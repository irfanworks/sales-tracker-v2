"use server";

import { revalidatePath } from "next/cache";
import { getAuthUser, getSupabase } from "@/lib/auth";
import { pipelineDetailPath, pipelineSlugFor } from "@/lib/pipelinePaths";
import { clipText, formatIdrShort, logSalesActivity } from "@/lib/salesActivity";
import type { SalesStage } from "@/lib/salesStage";

export type ConvertProspectResult =
  | { ok: true; redirectTo: string }
  | { ok: false; error: string };

/** Prospects enter the pipeline at the very start of the sales funnel. */
const INITIAL_STAGE: SalesStage = "Identified";

/**
 * Turn a pre-quote prospect into a pipeline: allocates a quote number, copies the
 * prospect's activity notes across, and marks the prospect Converted.
 */
export async function convertProspectToPipelineAction(input: {
  prospectId: string;
}): Promise<ConvertProspectResult> {
  const user = await getAuthUser();
  if (!user) return { ok: false, error: "Not authenticated. Please sign in again." };

  const supabase = await getSupabase();

  const { data: prospect, error: prospectError } = await supabase
    .from("prospects")
    .select(
      `
      id,
      customer_id,
      title,
      work_description,
      pic_name,
      pic_salutation,
      status,
      estimated_value,
      sales_id,
      customers ( id, name )
    `
    )
    .eq("id", input.prospectId)
    .single();

  if (prospectError || !prospect) {
    return { ok: false, error: prospectError?.message ?? "Prospect not found." };
  }

  if (prospect.status === "Converted") {
    return { ok: false, error: "This prospect has already been converted." };
  }

  const { data: existing } = await supabase
    .from("pipelines")
    .select("id, no_quote, pipeline_name, slug")
    .eq("source_prospect_id", prospect.id)
    .maybeSingle();

  if (existing?.id) {
    return {
      ok: true,
      redirectTo: pipelineDetailPath({
        id: existing.id,
        slug: existing.slug,
        no_quote: existing.no_quote,
        pipeline_name: existing.pipeline_name,
      }),
    };
  }

  const { data: allocated, error: allocError } = await supabase.rpc(
    "allocate_next_quote_number"
  );
  if (allocError || !allocated) {
    return { ok: false, error: allocError?.message ?? "Failed to allocate quote number." };
  }

  const alloc = allocated as {
    quote_base: string;
    no_quote: string;
    quote_revision: number;
  };

  const customer = Array.isArray(prospect.customers)
    ? prospect.customers[0]
    : prospect.customers;
  const customerName = (customer as { name?: string } | null)?.name ?? "customer";
  const pipelineName = prospect.title.trim();
  const workDescription = prospect.work_description?.trim() || null;
  const value = prospect.estimated_value != null ? Number(prospect.estimated_value) : 0;
  const stageChangedAt = new Date().toISOString();

  const { data: inserted, error: insertError } = await supabase
    .from("pipelines")
    .insert({
      no_quote: alloc.no_quote,
      quote_base: alloc.quote_base,
      quote_revision: alloc.quote_revision ?? 0,
      pipeline_name: pipelineName,
      customer_id: prospect.customer_id,
      pic_name: prospect.pic_name,
      pic_salutation: prospect.pic_salutation,
      value,
      pipeline_type: "Project",
      sales_stage: INITIAL_STAGE,
      sales_stage_changed_at: stageChangedAt,
      status: "Open",
      weekly_update: workDescription,
      source_prospect_id: prospect.id,
      sales_id: prospect.sales_id ?? user.id,
    })
    .select("id")
    .single();

  if (insertError || !inserted?.id) {
    return { ok: false, error: insertError?.message ?? "Failed to create pipeline." };
  }

  const pipelineId = inserted.id as string;
  const slug = pipelineSlugFor({
    id: pipelineId,
    no_quote: alloc.no_quote,
    pipeline_name: pipelineName,
  });
  await supabase.from("pipelines").update({ slug }).eq("id", pipelineId);

  await supabase.from("pipeline_stage_history").insert({
    pipeline_id: pipelineId,
    stage: INITIAL_STAGE,
    previous_stage: null,
    changed_at: stageChangedAt,
    changed_by: user.id,
    note: `Converted from prospect “${pipelineName}”`,
  });

  const { data: prospectUpdates } = await supabase
    .from("prospect_updates")
    .select("content, created_at, created_by")
    .eq("prospect_id", prospect.id)
    .order("created_at", { ascending: true });

  const carriedUpdates: Array<{
    pipeline_id: string;
    content: string;
    created_at: string;
    created_by: string;
  }> = [];

  if (workDescription) {
    carriedUpdates.push({
      pipeline_id: pipelineId,
      content: `Converted from prospect. Work description: ${workDescription}`,
      created_at: stageChangedAt,
      created_by: user.id,
    });
  }

  for (const u of prospectUpdates ?? []) {
    carriedUpdates.push({
      pipeline_id: pipelineId,
      content: u.content,
      created_at: u.created_at,
      created_by: u.created_by ?? user.id,
    });
  }

  if (carriedUpdates.length > 0) {
    const { error: updatesError } = await supabase
      .from("pipeline_updates")
      .insert(carriedUpdates);
    if (updatesError) {
      console.error("[convert-prospect-updates]", updatesError.message);
    }
  }

  const latestUpdate = (prospectUpdates ?? []).at(-1)?.content ?? null;
  if (latestUpdate) {
    await supabase
      .from("pipelines")
      .update({ weekly_update: latestUpdate })
      .eq("id", pipelineId);
  }

  const { error: statusError } = await supabase
    .from("prospects")
    .update({ status: "Converted" })
    .eq("id", prospect.id);

  if (statusError) {
    console.error("[convert-prospect-status]", statusError.message);
  }

  const detailPath = pipelineDetailPath({
    id: pipelineId,
    slug,
    no_quote: alloc.no_quote,
    pipeline_name: pipelineName,
  });

  await logSalesActivity(supabase, {
    actorId: user.id,
    actionType: "prospect_converted",
    entityType: "prospect",
    entityId: prospect.id,
    entityLabel: pipelineName,
    summary: `Converted prospect “${pipelineName}” to pipeline ${alloc.no_quote} (${customerName}, ${formatIdrShort(value)})`,
    details: workDescription ? `Work: ${clipText(workDescription)}` : null,
  });

  await logSalesActivity(supabase, {
    actorId: user.id,
    actionType: "pipeline_created",
    entityType: "pipeline",
    entityId: pipelineId,
    entityLabel: `${alloc.no_quote} · ${pipelineName}`,
    summary: `Created pipeline ${alloc.no_quote} “${pipelineName}” from prospect for ${customerName} (${formatIdrShort(value)}, ${INITIAL_STAGE})`,
    details: null,
  });

  revalidatePath("/dashboard/prospects");
  revalidatePath(`/dashboard/prospects/${prospect.id}`);
  revalidatePath("/dashboard/pipeline");
  revalidatePath(detailPath);

  return { ok: true, redirectTo: detailPath };
}
