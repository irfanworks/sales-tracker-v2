import { getAuthUser, getProfile, getSupabase } from "@/lib/auth";
import { pipelineDetailPath } from "@/lib/pipelinePaths";
import { jakartaTodayKey } from "@/lib/timezone";

export type OverdueOutcomePipeline = {
  id: string;
  no_quote: string;
  pipeline_name: string;
  target_closing_at: string;
  customer_name: string;
  sales_name: string | null;
  href: string;
  daysOverdue: number;
};

function daysBetweenDateKeys(pastKey: string, todayKey: string): number {
  const [py, pm, pd] = pastKey.split("-").map(Number);
  const [ty, tm, td] = todayKey.split("-").map(Number);
  const past = Date.UTC(py, pm - 1, pd);
  const today = Date.UTC(ty, tm - 1, td);
  return Math.max(0, Math.round((today - past) / 86_400_000));
}

type PipelineRow = {
  id: string;
  slug?: string | null;
  no_quote: string;
  pipeline_name: string;
  target_closing_at: string | null;
  outcome_status?: string | null;
  sales_id: string;
  status?: string | null;
  customers?:
    | { name?: string | null }
    | { name?: string | null }[]
    | null;
};

/**
 * Open pipelines whose target closing date is before today (Asia/Jakarta)
 * and that still have no outcome status.
 */
export async function getOverdueWithoutOutcome(previewLimit = 8): Promise<{
  count: number;
  items: OverdueOutcomePipeline[];
  isAdmin: boolean;
}> {
  const [user, profile] = await Promise.all([getAuthUser(), getProfile()]);
  if (!user) return { count: 0, items: [], isAdmin: false };

  const isAdmin = profile?.role === "admin";
  const today = jakartaTodayKey();
  const supabase = await getSupabase();

  let countQuery = supabase
    .from("pipelines")
    .select("id", { count: "exact", head: true })
    .not("target_closing_at", "is", null)
    .lt("target_closing_at", today)
    .is("outcome_status", null)
    .or("status.is.null,status.eq.Open");

  let listQuery = supabase
    .from("pipelines")
    .select(
      `
      id,
      slug,
      no_quote,
      pipeline_name,
      target_closing_at,
      outcome_status,
      sales_id,
      status,
      customers ( name )
    `
    )
    .not("target_closing_at", "is", null)
    .lt("target_closing_at", today)
    .is("outcome_status", null)
    .or("status.is.null,status.eq.Open")
    .order("target_closing_at", { ascending: true })
    .limit(previewLimit);

  if (!isAdmin) {
    countQuery = countQuery.eq("sales_id", user.id);
    listQuery = listQuery.eq("sales_id", user.id);
  }

  const [countResult, listResult] = await Promise.all([countQuery, listQuery]);

  if (countResult.error || listResult.error) {
    console.error(
      "[overdue-outcome]",
      countResult.error?.message ?? listResult.error?.message
    );
    return { count: 0, items: [], isAdmin };
  }

  const rows = (listResult.data ?? []) as PipelineRow[];
  const salesIds = [...new Set(rows.map((p) => p.sales_id))];
  const salesNames: Record<string, string> = {};

  if (isAdmin && salesIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, full_name")
      .in("id", salesIds);
    (profiles ?? []).forEach((p) => {
      salesNames[p.id] = p.display_name ?? p.full_name ?? "";
    });
  }

  const items: OverdueOutcomePipeline[] = rows.map((p) => {
    const customer = Array.isArray(p.customers) ? p.customers[0] : p.customers;
    const due = String(p.target_closing_at ?? "").slice(0, 10);
    return {
      id: p.id,
      no_quote: p.no_quote,
      pipeline_name: p.pipeline_name,
      target_closing_at: due,
      customer_name: customer?.name?.trim() || "—",
      sales_name: isAdmin ? salesNames[p.sales_id] || null : null,
      href: pipelineDetailPath({
        id: p.id,
        slug: p.slug,
        no_quote: p.no_quote,
        pipeline_name: p.pipeline_name,
      }),
      daysOverdue: due ? daysBetweenDateKeys(due, today) : 0,
    };
  });

  return { count: countResult.count ?? items.length, items, isAdmin };
}
