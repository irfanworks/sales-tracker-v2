"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAuthUser, getSupabase } from "@/lib/auth";
import { pipelineDetailPath, pipelineSlugFor } from "@/lib/pipelinePaths";
import { clipText, formatIdrShort, logSalesActivity } from "@/lib/salesActivity";
import {
  isSalesStage,
  isTerminalWinLose,
  lifecycleForStage,
  needsOutcomeReason,
  type SalesStage,
} from "@/lib/salesStage";
import {
  isLostReasonCategory,
  validateLostReasonInput,
  type LostReasonCategory,
} from "@/lib/lostAnalysis";
import {
  formatPicWithSalutation,
  isPicSalutation,
  type LifecycleStatus,
  type PaymentTermLine,
  type PicSalutation,
  type PipelineType,
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
    sales_stage: SalesStage;
    target_closing_at?: string | null;
  };
  pipeline_name: string;
  customer_id: string;
  customer_name: string;
  pic_name: string;
  pic_salutation: PicSalutation;
  pipeline_type: PipelineType;
  sales_stage: SalesStage;
  stage_reason?: string | null;
  stage_reason_category?: string | null;
  stage_note?: string | null;
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
  sales_stage: SalesStage;
  stage_reason?: string | null;
  stage_reason_category?: string | null;
  stage_note?: string | null;
  target_closing_at: string;
  initial_update: string;
  price_validity_days: number | null;
  delivery_weeks: number | null;
  payment_terms: PaymentTermLine[];
};

export type SimpleActionResult = { ok: true } | { ok: false; error: string };

/** Stage a reopened pipeline falls back to when history has no usable entry. */
const REOPEN_FALLBACK_STAGE: SalesStage = "Commercial Negotiation";

async function recordStageHistory(
  supabase: SupabaseClient,
  input: {
    pipelineId: string;
    stage: SalesStage;
    previousStage: SalesStage | null;
    changedBy: string;
    note?: string | null;
    reason?: string | null;
    reasonCategory?: string | null;
    changedAt: string;
  }
) {
  const { error } = await supabase.from("pipeline_stage_history").insert({
    pipeline_id: input.pipelineId,
    stage: input.stage,
    previous_stage: input.previousStage,
    changed_at: input.changedAt,
    changed_by: input.changedBy,
    note: input.note?.trim() || null,
    reason: input.reason?.trim() || null,
    reason_category: input.reasonCategory?.trim() || null,
  });
  if (error) {
    console.error("[pipeline-stage-history]", error.message);
  }
}

function lostReasonFields(input: {
  reason?: string | null;
  note?: string | null;
  reasonCategory?: string | null;
}): { reason: string; note: string; reasonCategory: LostReasonCategory } | { error: string } {
  const invalid = validateLostReasonInput({
    category: input.reasonCategory,
    notes: input.note,
  });
  if (invalid) return { error: invalid };
  return {
    reasonCategory: input.reasonCategory as LostReasonCategory,
    reason: (input.reasonCategory as LostReasonCategory) ?? "",
    note: input.note?.trim() ?? "",
  };
}

/** Most recent stage that is not Win / Lose — used when reopening a closed pipeline. */
async function previousOpenStage(
  supabase: SupabaseClient,
  pipelineId: string
): Promise<SalesStage> {
  const { data } = await supabase
    .from("pipeline_stage_history")
    .select("stage, previous_stage")
    .eq("pipeline_id", pipelineId)
    .order("changed_at", { ascending: false })
    .limit(20);

  for (const row of data ?? []) {
    const candidates = [row.stage, row.previous_stage];
    for (const candidate of candidates) {
      if (isSalesStage(candidate) && !isTerminalWinLose(candidate)) {
        return candidate;
      }
    }
  }
  return REOPEN_FALLBACK_STAGE;
}

export async function updatePipelineAction(
  input: UpdatePipelineInput
): Promise<PipelineActionResult> {
  const user = await getAuthUser();
  if (!user) return { ok: false, error: "Not authenticated. Please sign in again." };

  if (!isPicSalutation(input.pic_salutation)) {
    return { ok: false, error: "PIC salutation is required (Mr. / Mrs. / Ms.)." };
  }
  if (!isSalesStage(input.sales_stage)) {
    return { ok: false, error: "Sales stage is required." };
  }

  const supabase = await getSupabase();
  const { previous } = input;
  const projectName = input.pipeline_name.trim();
  const picName = input.pic_name.trim();
  const stageChanged = previous.sales_stage !== input.sales_stage;
  const reopening =
    stageChanged &&
    isTerminalWinLose(previous.sales_stage) &&
    !isTerminalWinLose(input.sales_stage);

  if (reopening && !input.stage_reason?.trim()) {
    return {
      ok: false,
      error: "Reopening a Win / Lose pipeline needs a reason.",
    };
  }

  const movingToOutcome =
    stageChanged && needsOutcomeReason(input.sales_stage);
  const outcomeReason = movingToOutcome
    ? lostReasonFields({
        reasonCategory: input.stage_reason_category,
        note: input.stage_note,
      })
    : null;
  if (outcomeReason && "error" in outcomeReason) {
    return { ok: false, error: outcomeReason.error };
  }

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
  if (stageChanged) {
    changes.push(`Sales stage → ${input.sales_stage}`);
  }
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

  const changedAt = new Date().toISOString();
  const stageFields = stageChanged
    ? {
        sales_stage: input.sales_stage,
        sales_stage_changed_at: changedAt,
        status: lifecycleForStage(input.sales_stage),
      }
    : {};

  const { error: updateError } = await supabase
    .from("pipelines")
    .update({
      pipeline_name: projectName,
      customer_id: input.customer_id,
      pic_name: picName,
      pic_salutation: input.pic_salutation,
      pipeline_type: input.pipeline_type,
      target_closing_at: input.target_closing_at || null,
      slug,
      ...stageFields,
    })
    .eq("id", input.id);

  if (updateError) return { ok: false, error: updateError.message };

  if (stageChanged) {
    await recordStageHistory(supabase, {
      pipelineId: input.id,
      stage: input.sales_stage,
      previousStage: previous.sales_stage,
      changedBy: user.id,
      reason: outcomeReason && "reason" in outcomeReason
        ? outcomeReason.reason
        : input.stage_reason ?? null,
      note:
        outcomeReason && "note" in outcomeReason
          ? outcomeReason.note
          : "Changed from pipeline edit form",
      reasonCategory:
        outcomeReason && "reasonCategory" in outcomeReason
          ? outcomeReason.reasonCategory
          : null,
      changedAt,
    });
  }

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

  const stage: SalesStage = isSalesStage(input.sales_stage)
    ? input.sales_stage
    : "Identified";

  const createOutcome = needsOutcomeReason(stage)
    ? lostReasonFields({
        reasonCategory: input.stage_reason_category,
        note: input.stage_note,
      })
    : null;
  if (createOutcome && "error" in createOutcome) {
    return { ok: false, error: createOutcome.error };
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
  const stageChangedAt = new Date().toISOString();
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
      sales_stage: stage,
      sales_stage_changed_at: stageChangedAt,
      status: lifecycleForStage(stage),
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

  await recordStageHistory(supabase, {
    pipelineId: inserted.id,
    stage,
    previousStage: null,
    changedBy: user.id,
    note:
      createOutcome && "note" in createOutcome
        ? createOutcome.note
        : "Pipeline created",
    reason:
      createOutcome && "reason" in createOutcome ? createOutcome.reason : null,
    reasonCategory:
      createOutcome && "reasonCategory" in createOutcome
        ? createOutcome.reasonCategory
        : null,
    changedAt: stageChangedAt,
  });

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
        summary: `Created pipeline ${alloc.no_quote} “${projectName}” for ${input.customer_name} (${formatIdrShort(input.value)}, ${stage})`,
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
    summary: `Created pipeline ${alloc.no_quote} “${projectName}” for ${input.customer_name} (${formatIdrShort(input.value)}, ${stage})`,
    details: trimmedUpdate ? `Initial note: ${clipText(trimmedUpdate)}` : null,
  });

  revalidatePath("/dashboard/pipeline");
  revalidatePath(detailPath);
  return { ok: true, redirectTo: detailPath };
}

export async function setPipelineSalesStageAction(input: {
  id: string;
  stage: SalesStage;
  note?: string | null;
  reason?: string | null;
  reasonCategory?: string | null;
  pipelineLabel?: string | null;
}): Promise<SimpleActionResult> {
  const user = await getAuthUser();
  if (!user) return { ok: false, error: "Not authenticated. Please sign in again." };

  if (!isSalesStage(input.stage)) {
    return { ok: false, error: "Unknown sales stage." };
  }

  const supabase = await getSupabase();
  const { data: current, error: readError } = await supabase
    .from("pipelines")
    .select("id, sales_stage, no_quote, pipeline_name")
    .eq("id", input.id)
    .single();

  if (readError || !current) {
    return { ok: false, error: readError?.message ?? "Pipeline not found." };
  }

  const previousStage = isSalesStage(current.sales_stage) ? current.sales_stage : null;
  if (previousStage === input.stage) return { ok: true };

  const reopening =
    previousStage != null &&
    isTerminalWinLose(previousStage) &&
    !isTerminalWinLose(input.stage);

  if (reopening && !input.reason?.trim()) {
    return { ok: false, error: `Reopening from ${previousStage} needs a reason.` };
  }

  const outcomeReason = needsOutcomeReason(input.stage)
    ? lostReasonFields({
        reasonCategory: input.reasonCategory,
        note: input.note,
      })
    : null;
  if (outcomeReason && "error" in outcomeReason) {
    return { ok: false, error: outcomeReason.error };
  }

  const changedAt = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("pipelines")
    .update({
      sales_stage: input.stage,
      sales_stage_changed_at: changedAt,
      status: lifecycleForStage(input.stage),
    })
    .eq("id", input.id);

  if (updateError) return { ok: false, error: updateError.message };

  await recordStageHistory(supabase, {
    pipelineId: input.id,
    stage: input.stage,
    previousStage,
    changedBy: user.id,
    note: outcomeReason && "note" in outcomeReason ? outcomeReason.note : input.note ?? null,
    reason:
      outcomeReason && "reason" in outcomeReason ? outcomeReason.reason : input.reason ?? null,
    reasonCategory:
      outcomeReason && "reasonCategory" in outcomeReason
        ? outcomeReason.reasonCategory
        : isLostReasonCategory(input.reasonCategory)
          ? input.reasonCategory
          : null,
    changedAt,
  });

  const label =
    input.pipelineLabel?.trim() || `${current.no_quote} · ${current.pipeline_name}`;

  await logSalesActivity(supabase, {
    actorId: user.id,
    actionType: "pipeline_stage_changed",
    entityType: "pipeline",
    entityId: input.id,
    entityLabel: label,
    summary: `Sales stage on ${label} → ${input.stage}`,
    details: [
      previousStage ? `From ${previousStage}` : null,
      input.reason?.trim() ? `Reason: ${clipText(input.reason)}` : null,
      input.note?.trim() ? `Note: ${clipText(input.note)}` : null,
    ]
      .filter(Boolean)
      .join(" · ") || null,
  });

  revalidatePath("/dashboard/pipeline");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/lost-analysis");
  revalidatePath(
    pipelineDetailPath({
      id: input.id,
      no_quote: current.no_quote,
      pipeline_name: current.pipeline_name,
    })
  );
  return { ok: true };
}

export async function bulkSetPipelineSalesStageAction(input: {
  ids: string[];
  stage: SalesStage;
  reason?: string | null;
  note?: string | null;
  reasonCategory?: string | null;
}): Promise<SimpleActionResult> {
  const user = await getAuthUser();
  if (!user) return { ok: false, error: "Not authenticated. Please sign in again." };
  if (!isSalesStage(input.stage)) return { ok: false, error: "Unknown sales stage." };

  const ids = [...new Set(input.ids.filter(Boolean))];
  if (ids.length === 0) return { ok: false, error: "No pipelines selected." };

  const supabase = await getSupabase();
  const { data: rows, error: readError } = await supabase
    .from("pipelines")
    .select("id, sales_stage, no_quote, pipeline_name")
    .in("id", ids);

  if (readError) return { ok: false, error: readError.message };

  const blocked = (rows ?? []).filter((row) => {
    const stage = isSalesStage(row.sales_stage) ? row.sales_stage : null;
    return (
      stage != null &&
      isTerminalWinLose(stage) &&
      !isTerminalWinLose(input.stage) &&
      !input.reason?.trim()
    );
  });

  if (blocked.length > 0) {
    return {
      ok: false,
      error: `${blocked.length} selected pipeline${blocked.length === 1 ? " is" : "s are"} Win / Lose — reopening them needs a reason.`,
    };
  }

  const outcomeReason = needsOutcomeReason(input.stage)
    ? lostReasonFields({
        reasonCategory: input.reasonCategory,
        note: input.note,
      })
    : null;
  if (outcomeReason && "error" in outcomeReason) {
    return { ok: false, error: outcomeReason.error };
  }

  const changedAt = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("pipelines")
    .update({
      sales_stage: input.stage,
      sales_stage_changed_at: changedAt,
      status: lifecycleForStage(input.stage),
    })
    .in("id", ids);

  if (updateError) return { ok: false, error: updateError.message };

  for (const row of rows ?? []) {
    const previousStage = isSalesStage(row.sales_stage) ? row.sales_stage : null;
    if (previousStage === input.stage) continue;
    const label = `${row.no_quote} · ${row.pipeline_name}`;

    await recordStageHistory(supabase, {
      pipelineId: row.id,
      stage: input.stage,
      previousStage,
      changedBy: user.id,
      note:
        outcomeReason && "note" in outcomeReason
          ? outcomeReason.note
          : "Bulk stage update",
      reason:
        outcomeReason && "reason" in outcomeReason
          ? outcomeReason.reason
          : input.reason ?? null,
      reasonCategory:
        outcomeReason && "reasonCategory" in outcomeReason
          ? outcomeReason.reasonCategory
          : null,
      changedAt,
    });

    await logSalesActivity(supabase, {
      actorId: user.id,
      actionType: "pipeline_stage_changed",
      entityType: "pipeline",
      entityId: row.id,
      entityLabel: label,
      summary: `Sales stage on ${label} → ${input.stage}`,
      details: previousStage ? `From ${previousStage}` : null,
    });
  }

  revalidatePath("/dashboard/pipeline");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/lost-analysis");
  return { ok: true };
}

/**
 * Open / Closed toggle. Closing is only valid on Win or Lose; reopening needs a
 * reason and rolls the stage back to the last non-terminal stage.
 */
export async function setPipelineLifecycleAction(input: {
  id: string;
  status: LifecycleStatus;
  reason?: string | null;
  pipelineLabel?: string | null;
}): Promise<SimpleActionResult> {
  const user = await getAuthUser();
  if (!user) return { ok: false, error: "Not authenticated. Please sign in again." };

  const supabase = await getSupabase();
  const { data: current, error: readError } = await supabase
    .from("pipelines")
    .select("id, status, sales_stage, no_quote, pipeline_name")
    .eq("id", input.id)
    .single();

  if (readError || !current) {
    return { ok: false, error: readError?.message ?? "Pipeline not found." };
  }

  const stage = isSalesStage(current.sales_stage) ? current.sales_stage : null;
  const label =
    input.pipelineLabel?.trim() || `${current.no_quote} · ${current.pipeline_name}`;
  const previousStatus: LifecycleStatus = current.status === "Closed" ? "Closed" : "Open";

  if (input.status === previousStatus) return { ok: true };

  if (input.status === "Closed") {
    if (stage == null || !isTerminalWinLose(stage)) {
      return {
        ok: false,
        error: "Set the sales stage to Win or Lose to close this pipeline.",
      };
    }

    const { error } = await supabase
      .from("pipelines")
      .update({ status: "Closed" })
      .eq("id", input.id);
    if (error) return { ok: false, error: error.message };

    await logSalesActivity(supabase, {
      actorId: user.id,
      actionType: "pipeline_status_changed",
      entityType: "pipeline",
      entityId: input.id,
      entityLabel: label,
      summary: `Marked pipeline ${label} as Closed`,
      details: `Stage ${stage}`,
    });

    revalidatePath("/dashboard/pipeline");
    revalidatePath("/dashboard");
    revalidatePath(
      pipelineDetailPath({
        id: input.id,
        no_quote: current.no_quote,
        pipeline_name: current.pipeline_name,
      })
    );
    return { ok: true };
  }

  const reason = input.reason?.trim();
  if (!reason) {
    return { ok: false, error: "Reopening a closed pipeline needs a reason." };
  }

  const nextStage =
    stage != null && !isTerminalWinLose(stage)
      ? stage
      : await previousOpenStage(supabase, input.id);
  const changedAt = new Date().toISOString();

  const { error } = await supabase
    .from("pipelines")
    .update({
      status: "Open",
      sales_stage: nextStage,
      sales_stage_changed_at: changedAt,
    })
    .eq("id", input.id);

  if (error) return { ok: false, error: error.message };

  if (nextStage !== stage) {
    await recordStageHistory(supabase, {
      pipelineId: input.id,
      stage: nextStage,
      previousStage: stage,
      changedBy: user.id,
      note: "Reopened pipeline",
      reason,
      changedAt,
    });
  }

  await logSalesActivity(supabase, {
    actorId: user.id,
    actionType: "pipeline_status_changed",
    entityType: "pipeline",
    entityId: input.id,
    entityLabel: label,
    summary: `Reopened pipeline ${label}`,
    details: `Stage ${stage ?? "—"} → ${nextStage} · Reason: ${clipText(reason)}`,
  });

  revalidatePath("/dashboard/pipeline");
  revalidatePath("/dashboard");
  revalidatePath(
    pipelineDetailPath({
      id: input.id,
      no_quote: current.no_quote,
      pipeline_name: current.pipeline_name,
    })
  );
  return { ok: true };
}
