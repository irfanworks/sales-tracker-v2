import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Activity, ArrowRight } from "lucide-react";
import {
  SALES_ACTIVITY_ACTION_LABELS,
  type SalesActivityActionType,
} from "@/lib/salesActivity";
import type { SalesActivityRow } from "@/components/SalesActivityFeed";

const ACTION_STYLES: Record<string, string> = {
  pipeline_created: "bg-emerald-100 text-emerald-800 border-emerald-200",
  pipeline_updated: "bg-sky-100 text-sky-800 border-sky-200",
  pipeline_deleted: "bg-red-100 text-red-800 border-red-200",
  pipeline_status_changed: "bg-amber-100 text-amber-800 border-amber-200",
  pipeline_update_added: "bg-cyan-100 text-cyan-800 border-cyan-200",
  quote_revised: "bg-indigo-100 text-indigo-800 border-indigo-200",
  prospect_created: "bg-emerald-100 text-emerald-800 border-emerald-200",
  prospect_updated: "bg-sky-100 text-sky-800 border-sky-200",
  prospect_deleted: "bg-red-100 text-red-800 border-red-200",
  prospect_update_added: "bg-cyan-100 text-cyan-800 border-cyan-200",
};

function actionLabel(actionType: string): string {
  return (
    SALES_ACTIVITY_ACTION_LABELS[actionType as SalesActivityActionType] ??
    actionType.replace(/_/g, " ")
  );
}

function entityHref(row: SalesActivityRow): string | null {
  if (!row.entity_id || !row.entity_type) return null;
  if (row.entity_type === "prospect") return `/dashboard/prospects/${row.entity_id}`;
  if (row.entity_type === "pipeline") return `/dashboard/pipeline/${row.entity_id}`;
  return null;
}

export function DashboardLatestActivity({
  activities,
}: {
  activities: SalesActivityRow[];
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-300/80 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-[#0f2744] px-4 py-3.5 text-white sm:px-5">
        <div className="flex items-center gap-2.5">
          <Activity className="h-4 w-4 text-cyan-300" />
          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.12em] sm:text-sm">
              Latest Activity
            </h2>
            <p className="text-[11px] text-slate-300">10 most recent sales actions</p>
          </div>
        </div>
        <Link
          href="/dashboard/sales-activity"
          className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/15"
        >
          View all
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {activities.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-slate-500">
          No sales activity logged yet. Actions on pipelines and prospects will appear here.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {activities.map((row) => {
            const href = entityHref(row);
            const style =
              ACTION_STYLES[row.action_type] ?? "bg-slate-100 text-slate-700 border-slate-200";

            return (
              <li key={row.id} className="px-4 py-3.5 transition hover:bg-slate-50/80 sm:px-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`badge border ${style}`}>{actionLabel(row.action_type)}</span>
                  <span className="text-sm font-semibold text-slate-800">
                    {row.actor_name ?? "Unknown"}
                  </span>
                  <span className="text-xs tabular-nums text-slate-400">
                    {formatDistanceToNow(new Date(row.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-700">{row.summary}</p>
                {row.details && (
                  <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{row.details}</p>
                )}
                {href && row.entity_label && (
                  <Link
                    href={href}
                    className="mt-1.5 inline-block text-xs font-medium text-cyan-700 hover:underline"
                  >
                    Open {row.entity_type}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
