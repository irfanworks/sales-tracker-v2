import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Activity, ArrowRight, ArrowUpRight } from "lucide-react";
import {
  SALES_ACTIVITY_ACTION_LABELS,
  SALES_ACTIVITY_ACTION_VERB,
  type SalesActivityActionType,
} from "@/lib/salesActivity";
import type { SalesActivityRow } from "@/components/SalesActivityFeed";
import { formatJakartaDateTime, formatJakartaTime } from "@/lib/timezone";

const TONE: Record<string, string> = {
  pipeline_created: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  pipeline_updated: "bg-sky-50 text-sky-800 ring-sky-200",
  pipeline_deleted: "bg-red-50 text-red-800 ring-red-200",
  pipeline_status_changed: "bg-amber-50 text-amber-900 ring-amber-200",
  pipeline_update_added: "bg-cyan-50 text-cyan-900 ring-cyan-200",
  quote_revised: "bg-indigo-50 text-indigo-900 ring-indigo-200",
  prospect_created: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  prospect_updated: "bg-sky-50 text-sky-800 ring-sky-200",
  prospect_deleted: "bg-red-50 text-red-800 ring-red-200",
  prospect_update_added: "bg-cyan-50 text-cyan-900 ring-cyan-200",
};

function verbFor(actionType: string): string {
  return (
    SALES_ACTIVITY_ACTION_VERB[actionType as SalesActivityActionType] ??
    SALES_ACTIVITY_ACTION_LABELS[actionType as SalesActivityActionType] ??
    "Action"
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
            <p className="text-[11px] text-slate-300">Real create / edit actions only · GMT+7</p>
          </div>
        </div>
        <Link
          href="/dashboard/sales-activity"
          className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/15"
        >
          Weekly review
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {activities.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-slate-500">
          No recent sales actions. Empty saves are not logged.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {activities.map((row) => {
            const href = entityHref(row);
            const tone = TONE[row.action_type] ?? "bg-slate-50 text-slate-700 ring-slate-200";
            const entityKind =
              row.entity_type === "pipeline"
                ? "Pipeline"
                : row.entity_type === "prospect"
                  ? "Prospect"
                  : null;

            return (
              <li key={row.id} className="px-4 py-3.5 transition hover:bg-slate-50/80 sm:px-5">
                <div className="flex flex-wrap items-center gap-2">
                  <time
                    className="text-xs font-bold tabular-nums text-slate-500"
                    dateTime={row.created_at}
                    title={`${formatJakartaDateTime(row.created_at)} GMT+7`}
                  >
                    {formatJakartaTime(row.created_at)}
                  </time>
                  <span className="text-sm font-bold text-slate-900">
                    {row.actor_name ?? "Unknown"}
                  </span>
                  <span
                    className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${tone}`}
                  >
                    {verbFor(row.action_type)}
                    {entityKind ? ` · ${entityKind}` : ""}
                  </span>
                  <span className="text-[11px] tabular-nums text-slate-400">
                    {formatDistanceToNow(new Date(row.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="mt-1.5 text-sm leading-snug text-slate-700">{row.summary}</p>
                {row.details && (
                  <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{row.details}</p>
                )}
                {href && (
                  <Link
                    href={href}
                    className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-cyan-700 hover:underline"
                  >
                    Open
                    <ArrowUpRight className="h-3 w-3" />
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
