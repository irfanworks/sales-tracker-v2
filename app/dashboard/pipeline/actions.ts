"use server";

import { revalidatePath } from "next/cache";
import { getAuthUser, getSupabase } from "@/lib/auth";
import { pipelineDetailPath, pipelineSlugFor } from "@/lib/pipelinePaths";
import { clipText, formatIdrShort, logSalesActivity } from "@/lib/salesActivity";
import {
  formatPicWithSalutation,
  isPicSalutation,
  type OutcomeStatus,
  type PaymentTermLine,
  type PicSalutation,
  type PipelineType,
  type ProgressType,
  type ProspectOption,
} from "@/lib/types/database";

export type PipelineActionResult =
  | { ok: true; redirectTo: string }
  | { ok: false; error: string };

export type UpdatePipelineInput = {
  id: string;
  no_quote: string;
  previous: {
    pipeline_name: string;
    customer_id: string;
    pic_name?: string | null;
    pic_salutation?: PicSalutation | null;
    pipeline_type?: PipelineType | null;
    progress_type: ProgressType;
    outcome_status?: OutcomeStatus | null;
    prospect: ProspectOption;
    target_closing_at?: string | null;
  };
  pipeline_name: string;
  customer_id: string;
  customer_name: string;
  pic_name: string;
  pic_salutation: PicSalutation;
  pipeline_type: PipelineType;
  progress_type: ProgressType;
  outcome_status: OutcomeStatus | "";
  prospect: ProspectOption;
  target_closing_at: string;
  backPath?: string;
};

export type CreatePipelineInput = {
  pipeline_name: string;
  customer_id: string;
  customer_name: string;
  pic_name: string;
  pic_salutation: PicSalutation;
  value: number;
  pipeline_type: PipelineType;
  progress_type: ProgressType;
  prospect: ProspectOption;
  target_closing_at: string;
  initial_update: string;
  price_validity_days: number | null;
  delivery_weeks: number | null;
  payment_terms: PaymentTermLine[];
};

export async function updatePipelineAction(
  input: UpdatePipelineInput
): Promise<PipelineActionResult> {
  const user = await getAuthUser();
  if (!user) return { ok: false, error: "Not authenticated. Please sign in again." };

  if (!isPicSalutation(input.pic_salutation)) {
    return { ok: false, error: "PIC salutation is required (Mr. / Mrs. / Ms.)." };
  }

  const supabase = await getSupabase();
  const { previous } = input;
  const projectName = input.pipeline_name.trim();
  const picName = input.pic_name.trim();

  const slug = pipelineSlugFor({
    id: input.id,
    no_quote: input.no_quote,
    pipeline_name: projectName,
  });

  const changes: string[] = [];
  if (previous.pipeline_name !== projectName) changes.push(`Name → ${projectName}`);
  if (previous.customer_id !== input.customer_id) {
    changes.push(`Customer → ${input.customer_name}`);
  }
  const prevPic = formatPicWithSalutation(previous.pic_salutation, previous.pic_name);
  const nextPic = formatPicWithSalutation(input.pic_salutation, picName);
  if (prevPic !== nextPic) changes.push(`PIC → ${nextPic}`);
  if ((previous.pipeline_type ?? "Project") !== input.pipeline_type) {
    changes.push(`Type → ${input.pipeline_type}`);
  }
  if (previous.progress_type !== input.progress_type) {
    changes.push(`Progress → ${input.progress_type}`);
  }
  if ((previous.outcome_status ?? "") !== (input.outcome_status || "")) {
    changes.push(`Outcome → ${input.outcome_status || "cleared"}`);
  }
  if (previous.prospect !== input.prospect) changes.push(`Heat → ${input.prospect}`);
  const prevClosing = previous.target_closing_at?.slice(0, 10) ?? "";
  if (prevClosing !== (input.target_closing_at || "")) {
    changes.push(`Target closing → ${input.target_closing_at || "cleared"}`);
  }

  const detailPath =
    input.backPath ??
    pipelineDetailPath({
      id: input.id,
      no_quote: input.no_quote,
      pipeline_name: projectName,
      slug,
    });

  if (changes.length === 0) {
    return { ok: true, redirectTo: detailPath };
  }

  const { error: updateError } = await supabase
    .from("pipelines")
    .update({
      pipeline_name: projectName,
      customer_id: input.customer_id,
      pic_name: picName,
      pic_salutation: input.pic_salutation,
      pipeline_type: input.pipeline_type,
      progress_type: input.progress_type,
      outcome_status: input.outcome_status || null,
      prospect: input.prospect,
      target_closing_at: input.target_closing_at || null,
      slug,
    })
    .eq("id", input.id);

  if (updateError) return { ok: false, error: updateError.message };

  await logSalesActivity(supabase, {
    actorId: user.id,
    actionType: "pipeline_updated",
    entityType: "pipeline",
    entityId: input.id,
    entityLabel: `${input.no_quote} · ${projectName}`,
    summary: `Edited pipeline ${input.no_quote} “${projectName}”`,
    details: changes.join(" · "),
  });

  revalidatePath("/dashboard/pipeline");
  revalidatePath(detailPath);
  return { ok: true, redirectTo: detailPath };
}

export async function createPipelineAction(
  input: CreatePipelineInput
): Promise<PipelineActionResult> {
  const user = await getAuthUser();
  if (!user) return { ok: false, error: "Not authenticated. Please sign in again." };

  if (!isPicSalutation(input.pic_salutation)) {
    return { ok: false, error: "PIC salutation is required (Mr. / Mrs. / Ms.)." };
  }

  const supabase = await getSupabase();
  const projectName = input.pipeline_name.trim();
  const picName = input.pic_name.trim();

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

  const trimmedUpdate = input.initial_update.trim();
  const { data: inserted, error: insertError } = await supabase
    .from("pipelines")
    .insert({
      no_quote: alloc.no_quote,
      quote_base: alloc.quote_base,
      quote_revision: alloc.quote_revision ?? 0,
      pipeline_name: projectName,
      customer_id: input.customer_id,
      pic_name: picName,
      pic_salutation: input.pic_salutation,
      value: input.value,
      pipeline_type: input.pipeline_type,
      progress_type: input.progress_type,
      outcome_status: null,
      prospect: input.prospect,
      status: "Open",
      weekly_update: trimmedUpdate || null,
      target_closing_at: input.target_closing_at || null,
      price_validity_days: input.price_validity_days,
      delivery_weeks: input.delivery_weeks,
      payment_terms: input.payment_terms,
      sales_id: user.id,
    })
    .select("id")
    .single();

  if (insertError || !inserted?.id) {
    return { ok: false, error: insertError?.message ?? "Failed to create pipeline" };
  }

  const slug = pipelineSlugFor({
    id: inserted.id,
    no_quote: alloc.no_quote,
    pipeline_name: projectName,
  });

  await supabase.from("pipelines").update({ slug }).eq("id", inserted.id);

  const detailPath = pipelineDetailPath({
    id: inserted.id,
    no_quote: alloc.no_quote,
    pipeline_name: projectName,
    slug,
  });

  if (trimmedUpdate) {
    const { error: updateHistoryError } = await supabase.from("pipeline_updates").insert({
      pipeline_id: inserted.id,
      content: trimmedUpdate,
      created_by: user.id,
    });
    if (updateHistoryError) {
      await logSalesActivity(supabase, {
        actorId: user.id,
        actionType: "pipeline_created",
        entityType: "pipeline",
        entityId: inserted.id,
        entityLabel: `${alloc.no_quote} · ${projectName}`,
        summary: `Created pipeline ${alloc.no_quote} “${projectName}” for ${input.customer_name} (${formatIdrShort(input.value)}, ${input.progress_type})`,
        details: null,
      });
      revalidatePath("/dashboard/pipeline");
      revalidatePath(detailPath);
      return {
        ok: false,
        error: `Pipeline created but initial update failed to save: ${updateHistoryError.message}. Open the pipeline and add the note manually.`,
      };
    }
  }

  await logSalesActivity(supabase, {
    actorId: user.id,
    actionType: "pipeline_created",
    entityType: "pipeline",
    entityId: inserted.id,
    entityLabel: `${alloc.no_quote} · ${projectName}`,
    summary: `Created pipeline ${alloc.no_quote} “${projectName}” for ${input.customer_name} (${formatIdrShort(input.value)}, ${input.progress_type})`,
    details: trimmedUpdate ? `Initial note: ${clipText(trimmedUpdate)}` : null,
  });

  revalidatePath("/dashboard/pipeline");
  revalidatePath(detailPath);
  return { ok: true, redirectTo: detailPath };
}

export type SimpleActionResult = { ok: true } | { ok: false; error: string };

function normalizeOutcome(
  value: OutcomeStatus | "" | null | undefined
): OutcomeStatus | null {
  if (value === "Win" || value === "Lose" || value === "On Hold") return value;
  return null;
}

export async function setPipelineOutcomeAction(input: {
  id: string;
  outcome: OutcomeStatus | null;
  previousOutcome?: OutcomeStatus | null;
  pipelineLabel?: string | null;
}): Promise<SimpleActionResult> {
  const user = await getAuthUser();
  if (!user) return { ok: false, error: "Not authenticated. Please sign in again." };

  const next = normalizeOutcome(input.outcome);
  const prev = normalizeOutcome(input.previousOutcome);
  if (next === prev) return { ok: true };

  const supabase = await getSupabase();
  const { error } = await supabase
    .from("pipelines")
    .update({ outcome_status: next })
    .eq("id", input.id);

  if (error) return { ok: false, error: error.message };

  const label = input.pipelineLabel?.trim() || null;
  await logSalesActivity(supabase, {
    actorId: user.id,
    actionType: "pipeline_updated",
    entityType: "pipeline",
    entityId: input.id,
    entityLabel: label,
    summary: `Set outcome${label ? ` on ${label}` : ""} to ${next ?? "cleared"}`,
    details: `Outcome → ${next ?? "cleared"}`,
  });

  revalidatePath("/dashboard/pipeline");
  revalidatePath(`/dashboard/pipeline/${input.id}`);
  return { ok: true };
}

export async function bulkSetPipelineOutcomeAction(input: {
  ids: string[];
  outcome: OutcomeStatus | null;
  rows?: { id: string; label: string; previousOutcome?: OutcomeStatus | null }[];
}): Promise<SimpleActionResult> {
  const user = await getAuthUser();
  if (!user) return { ok: false, error: "Not authenticated. Please sign in again." };

  const ids = [...new Set(input.ids.filter(Boolean))];
  if (ids.length === 0) return { ok: false, error: "No pipelines selected." };

  const next = normalizeOutcome(input.outcome);
  const supabase = await getSupabase();
  const { error } = await supabase
    .from("pipelines")
    .update({ outcome_status: next })
    .in("id", ids);

  if (error) return { ok: false, error: error.message };

  const rowMap = new Map((input.rows ?? []).map((r) => [r.id, r]));
  for (const id of ids) {
    const row = rowMap.get(id);
    await logSalesActivity(supabase, {
      actorId: user.id,
      actionType: "pipeline_updated",
      entityType: "pipeline",
      entityId: id,
      entityLabel: row?.label ?? null,
      summary: `Set outcome${row?.label ? ` on ${row.label}` : ""} to ${next ?? "cleared"}`,
      details: `Outcome → ${next ?? "cleared"}`,
    });
  }

  revalidatePath("/dashboard/pipeline");
  return { ok: true };
}
