import type { SupabaseClient } from "@supabase/supabase-js";

export type SalesActivityActionType =
  | "pipeline_created"
  | "pipeline_updated"
  | "pipeline_deleted"
  | "pipeline_status_changed"
  | "pipeline_update_added"
  | "quote_revised"
  | "prospect_created"
  | "prospect_updated"
  | "prospect_deleted"
  | "prospect_update_added";

export type SalesActivityEntityType = "pipeline" | "prospect";

export type LogSalesActivityInput = {
  actorId: string;
  actionType: SalesActivityActionType;
  summary: string;
  details?: string | null;
  entityType?: SalesActivityEntityType | null;
  entityId?: string | null;
  entityLabel?: string | null;
};

/** Best-effort activity write — never throw; logging must not block the main action. */
export async function logSalesActivity(
  supabase: SupabaseClient,
  input: LogSalesActivityInput
): Promise<void> {
  try {
    const { error } = await supabase.from("sales_activity_log").insert({
      actor_id: input.actorId,
      action_type: input.actionType,
      summary: input.summary.trim(),
      details: input.details?.trim() || null,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      entity_label: input.entityLabel?.trim() || null,
    });
    if (error) {
      console.error("sales_activity_log insert failed:", error.message);
    }
  } catch (err) {
    console.error("sales_activity_log insert failed:", err);
  }
}

export function formatIdrShort(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function clipText(text: string, max = 160): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export const SALES_ACTIVITY_ACTION_LABELS: Record<SalesActivityActionType, string> = {
  pipeline_created: "New pipeline",
  pipeline_updated: "Pipeline edited",
  pipeline_deleted: "Pipeline deleted",
  pipeline_status_changed: "Pipeline status",
  pipeline_update_added: "Pipeline update",
  quote_revised: "Quote revised",
  prospect_created: "New prospect",
  prospect_updated: "Prospect edited",
  prospect_deleted: "Prospect deleted",
  prospect_update_added: "Prospect update",
};
