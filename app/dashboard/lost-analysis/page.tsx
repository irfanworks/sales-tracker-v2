import Link from "next/link";
import { format } from "date-fns";
import { TrendingDown } from "lucide-react";
import { getSupabase } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { SalesStageBadge } from "@/components/SalesStageBadge";
import { pipelineDetailPath } from "@/lib/pipelinePaths";
import { LOST_REASON_CATEGORIES, type LostReasonCategory } from "@/lib/lostAnalysis";
import type { SalesStage } from "@/lib/salesStage";

export const dynamic = "force-dynamic";

type HistoryJoin = {
  id: string;
  stage: string;
  reason_category: string | null;
  note: string | null;
  changed_at: string;
  pipelines:
    | {
        id: string;
        slug: string | null;
        no_quote: string;
        pipeline_name: string;
        value: number | null;
        customers: { name: string } | { name: string }[] | null;
      }
    | {
        id: string;
        slug: string | null;
        no_quote: string;
        pipeline_name: string;
        value: number | null;
        customers: { name: string } | { name: string }[] | null;
      }[]
    | null;
};

function customerName(raw: HistoryJoin["pipelines"]): string {
  const pipeline = Array.isArray(raw) ? raw[0] : raw;
  const customer = pipeline?.customers;
  const c = Array.isArray(customer) ? customer[0] : customer;
  return c?.name ?? "—";
}

function pipelineRow(raw: HistoryJoin["pipelines"]) {
  return Array.isArray(raw) ? raw[0] : raw;
}

function formatIdr(value: number | null | undefined) {
  if (value == null) return "—";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function LostAnalysisPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string; category?: string }>;
}) {
  const params = await searchParams;
  const stageFilter =
    params.stage === "Lose" || params.stage === "On Hold" ? params.stage : null;
  const categoryFilter = LOST_REASON_CATEGORIES.includes(
    params.category as LostReasonCategory
  )
    ? (params.category as LostReasonCategory)
    : null;

  const supabase = await getSupabase();
  let historyQuery = supabase
    .from("pipeline_stage_history")
    .select(
      `
      id,
      stage,
      reason_category,
      note,
      changed_at,
      pipelines (
        id,
        slug,
        no_quote,
        pipeline_name,
        value,
        customers ( name )
      )
    `
    )
    .order("changed_at", { ascending: false })
    .limit(100);

  if (stageFilter) {
    historyQuery = historyQuery.eq("stage", stageFilter);
  } else {
    historyQuery = historyQuery.in("stage", ["Lose", "On Hold"]);
  }
  if (categoryFilter) {
    historyQuery = historyQuery.eq("reason_category", categoryFilter);
  }

  // Category cards: separate slim query (no notes / joins) so filters don't skew totals.
  const summaryPromise = supabase
    .from("pipeline_stage_history")
    .select("stage, reason_category, pipelines ( value )")
    .in("stage", ["Lose", "On Hold"])
    .order("changed_at", { ascending: false })
    .limit(1000);

  const [{ data, error }, { data: summaryRows }] = await Promise.all([
    historyQuery,
    summaryPromise,
  ]);

  if (error) {
    return (
      <div className="card p-6">
        <p className="text-red-600">Error loading lost analysis. Please try again.</p>
      </div>
    );
  }

  type SummaryRow = {
    stage: string;
    reason_category: string | null;
    pipelines:
      | { value: number | null }
      | { value: number | null }[]
      | null;
  };

  const summary = (summaryRows ?? []) as SummaryRow[];
  const loseCount = summary.filter((r) => r.stage === "Lose").length;
  const holdCount = summary.filter((r) => r.stage === "On Hold").length;
  const byCategory = LOST_REASON_CATEGORIES.map((category) => {
    const items = summary.filter((r) => r.reason_category === category);
    const value = items.reduce((sum, r) => {
      const p = Array.isArray(r.pipelines) ? r.pipelines[0] : r.pipelines;
      return sum + (p?.value != null ? Number(p.value) : 0);
    }, 0);
    return { category, count: items.length, value };
  });
  const uncategorized = summary.filter((r) => !r.reason_category).length;

  const visible = (data ?? []) as HistoryJoin[];
  function hrefFor(next: { stage?: string | null; category?: string | null }) {
    const q = new URLSearchParams();
    const stage = next.stage === undefined ? stageFilter : next.stage;
    const category = next.category === undefined ? categoryFilter : next.category;
    if (stage) q.set("stage", stage);
    if (category) q.set("category", category);
    const s = q.toString();
    return s ? `/dashboard/lost-analysis?${s}` : "/dashboard/lost-analysis";
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        icon={TrendingDown}
        title="Lost Analysis"
        description="Pola Lose dan On Hold dari histori sales stage — kategori alasan plus notes."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card-elevated p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Lose events</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{loseCount}</p>
        </div>
        <div className="card-elevated p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">On Hold events</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{holdCount}</p>
        </div>
        {byCategory.map((item) => (
          <div key={item.category} className="card-elevated p-4 sm:col-span-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {item.category}
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{item.count}</p>
            <p className="mt-0.5 text-xs text-slate-500">{formatIdr(item.value)}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {byCategory.map((item) => (
          <Link
            key={item.category}
            href={hrefFor({
              category: categoryFilter === item.category ? null : item.category,
            })}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              categoryFilter === item.category
                ? "border-cyan-300 bg-cyan-50 text-cyan-900"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            }`}
          >
            {item.category} · {item.count}
          </Link>
        ))}
        <Link
          href={hrefFor({ stage: stageFilter === "Lose" ? null : "Lose" })}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
            stageFilter === "Lose"
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
          }`}
        >
          Lose only
        </Link>
        <Link
          href={hrefFor({ stage: stageFilter === "On Hold" ? null : "On Hold" })}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
            stageFilter === "On Hold"
              ? "border-amber-200 bg-amber-50 text-amber-900"
              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
          }`}
        >
          On Hold only
        </Link>
        {uncategorized > 0 ? (
          <span className="rounded-full border border-dashed border-slate-200 px-3 py-1.5 text-xs text-slate-500">
            Uncategorized · {uncategorized}
          </span>
        ) : null}
      </div>

      <div className="table-shell overflow-hidden">
        {visible.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-slate-500">
            No Lose / On Hold records match these filters yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="table-header-row">
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-4 py-3.5">Pipeline</th>
                  <th className="px-4 py-3.5">Stage</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Notes</th>
                  <th className="px-4 py-3.5">Value</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => {
                  const pipeline = pipelineRow(row.pipelines);
                  const href = pipeline
                    ? pipelineDetailPath({
                        id: pipeline.id,
                        slug: pipeline.slug,
                        no_quote: pipeline.no_quote,
                        pipeline_name: pipeline.pipeline_name,
                      })
                    : null;
                  return (
                    <tr key={row.id} className="table-row">
                      <td className="whitespace-nowrap px-4 py-3.5 text-slate-500">
                        {format(new Date(row.changed_at), "dd MMM yyyy")}
                      </td>
                      <td className="px-4 py-3.5">
                        {href ? (
                          <Link href={href} className="font-medium text-cyan-700 hover:underline">
                            {pipeline?.pipeline_name}
                          </Link>
                        ) : (
                          <span className="text-slate-500">Deleted pipeline</span>
                        )}
                        <p className="text-xs text-slate-500">
                          {pipeline?.no_quote} · {customerName(row.pipelines)}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <SalesStageBadge value={row.stage as SalesStage} />
                      </td>
                      <td className="px-4 py-3.5 text-slate-700">
                        {row.reason_category ?? "—"}
                      </td>
                      <td className="max-w-sm px-4 py-3.5 text-slate-600">{row.note ?? "—"}</td>
                      <td className="whitespace-nowrap px-4 py-3.5 tabular-nums text-slate-700">
                        {formatIdr(pipeline?.value != null ? Number(pipeline.value) : null)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
