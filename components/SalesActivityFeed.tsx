import Link from "next/link";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import {
  SALES_ACTIVITY_ACTION_LABELS,
  type SalesActivityActionType,
} from "@/lib/salesActivity";
import { EmptyState } from "@/components/ui/EmptyState";
import { Activity } from "lucide-react";

export type SalesActivityRow = {
  id: string;
  created_at: string;
  actor_id: string;
  action_type: string;
  entity_type: string | null;
  entity_id: string | null;
  entity_label: string | null;
  summary: string;
  details: string | null;
  actor_name: string | null;
};

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

function dayHeading(iso: string): string {
  const d = new Date(iso);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "EEEE, dd MMM yyyy");
}

function entityHref(row: SalesActivityRow): string | null {
  if (!row.entity_id || !row.entity_type) return null;
  if (row.entity_type === "prospect") return `/dashboard/prospects/${row.entity_id}`;
  if (row.entity_type === "pipeline") {
    // Prefer id path; pipeline detail redirects UUID → slug when possible
    return `/dashboard/pipeline/${row.entity_id}`;
  }
  return null;
}

export function SalesActivityFeed({ activities }: { activities: SalesActivityRow[] }) {
  if (activities.length === 0) {
    return (
      <EmptyState
        icon={Activity}
        title="No activity in this period"
        description="Try widening the date range. New actions by sales will appear here automatically."
      />
    );
  }

  const groups: { heading: string; items: SalesActivityRow[] }[] = [];
  for (const row of activities) {
    const heading = dayHeading(row.created_at);
    const last = groups[groups.length - 1];
    if (last && last.heading === heading) last.items.push(row);
    else groups.push({ heading, items: [row] });
  }

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.heading}>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">
            {group.heading}
          </h2>
          <ol className="space-y-3">
            {group.items.map((row) => {
              const href = entityHref(row);
              const style =
                ACTION_STYLES[row.action_type] ?? "bg-slate-100 text-slate-700 border-slate-200";

              return (
                <li
                  key={row.id}
                  className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:border-slate-300"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`badge border ${style}`}>{actionLabel(row.action_type)}</span>
                      <span className="text-sm font-semibold text-slate-800">
                        {row.actor_name ?? "Unknown sales"}
                      </span>
                    </div>
                    <time
                      className="text-xs tabular-nums text-slate-500"
                      dateTime={row.created_at}
                      title={format(new Date(row.created_at), "dd MMM yyyy, HH:mm")}
                    >
                      {format(new Date(row.created_at), "HH:mm")} ·{" "}
                      {formatDistanceToNow(new Date(row.created_at), { addSuffix: true })}
                    </time>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-800">{row.summary}</p>
                  {row.details && (
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{row.details}</p>
                  )}
                  {href && row.entity_label && (
                    <p className="mt-2">
                      <Link href={href} className="text-xs font-medium text-cyan-700 hover:underline">
                        Open {row.entity_type}: {row.entity_label}
                      </Link>
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
