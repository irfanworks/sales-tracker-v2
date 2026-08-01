import Link from "next/link";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import {
  SALES_ACTIVITY_ACTION_LABELS,
  SALES_ACTIVITY_ACTION_VERB,
  type SalesActivityActionType,
} from "@/lib/salesActivity";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Activity,
  ArrowUpRight,
  FilePenLine,
  FilePlus2,
  MessageSquareText,
  Pencil,
  Trash2,
  Trophy,
  type LucideIcon,
} from "lucide-react";

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

const ACTION_META: Record<
  string,
  { label: string; verb: string; tone: string; icon: LucideIcon }
> = {
  pipeline_created: {
    label: SALES_ACTIVITY_ACTION_LABELS.pipeline_created,
    verb: SALES_ACTIVITY_ACTION_VERB.pipeline_created,
    tone: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    icon: FilePlus2,
  },
  pipeline_updated: {
    label: SALES_ACTIVITY_ACTION_LABELS.pipeline_updated,
    verb: SALES_ACTIVITY_ACTION_VERB.pipeline_updated,
    tone: "bg-sky-50 text-sky-800 ring-sky-200",
    icon: Pencil,
  },
  pipeline_deleted: {
    label: SALES_ACTIVITY_ACTION_LABELS.pipeline_deleted,
    verb: SALES_ACTIVITY_ACTION_VERB.pipeline_deleted,
    tone: "bg-red-50 text-red-800 ring-red-200",
    icon: Trash2,
  },
  pipeline_status_changed: {
    label: SALES_ACTIVITY_ACTION_LABELS.pipeline_status_changed,
    verb: SALES_ACTIVITY_ACTION_VERB.pipeline_status_changed,
    tone: "bg-amber-50 text-amber-900 ring-amber-200",
    icon: Trophy,
  },
  pipeline_update_added: {
    label: SALES_ACTIVITY_ACTION_LABELS.pipeline_update_added,
    verb: SALES_ACTIVITY_ACTION_VERB.pipeline_update_added,
    tone: "bg-cyan-50 text-cyan-900 ring-cyan-200",
    icon: MessageSquareText,
  },
  quote_revised: {
    label: SALES_ACTIVITY_ACTION_LABELS.quote_revised,
    verb: SALES_ACTIVITY_ACTION_VERB.quote_revised,
    tone: "bg-indigo-50 text-indigo-900 ring-indigo-200",
    icon: FilePenLine,
  },
  prospect_created: {
    label: SALES_ACTIVITY_ACTION_LABELS.prospect_created,
    verb: SALES_ACTIVITY_ACTION_VERB.prospect_created,
    tone: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    icon: FilePlus2,
  },
  prospect_updated: {
    label: SALES_ACTIVITY_ACTION_LABELS.prospect_updated,
    verb: SALES_ACTIVITY_ACTION_VERB.prospect_updated,
    tone: "bg-sky-50 text-sky-800 ring-sky-200",
    icon: Pencil,
  },
  prospect_deleted: {
    label: SALES_ACTIVITY_ACTION_LABELS.prospect_deleted,
    verb: SALES_ACTIVITY_ACTION_VERB.prospect_deleted,
    tone: "bg-red-50 text-red-800 ring-red-200",
    icon: Trash2,
  },
  prospect_update_added: {
    label: SALES_ACTIVITY_ACTION_LABELS.prospect_update_added,
    verb: SALES_ACTIVITY_ACTION_VERB.prospect_update_added,
    tone: "bg-cyan-50 text-cyan-900 ring-cyan-200",
    icon: MessageSquareText,
  },
};

function metaFor(actionType: string) {
  return (
    ACTION_META[actionType] ?? {
      label:
        SALES_ACTIVITY_ACTION_LABELS[actionType as SalesActivityActionType] ??
        actionType.replace(/_/g, " "),
      verb: "Action",
      tone: "bg-slate-50 text-slate-700 ring-slate-200",
      icon: Activity,
    }
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
  if (row.entity_type === "pipeline") return `/dashboard/pipeline/${row.entity_id}`;
  return null;
}

function detailChips(details: string | null): string[] {
  if (!details?.trim()) return [];
  return details
    .split(" · ")
    .map((s) => s.trim())
    .filter(Boolean);
}

function buildBrief(activities: SalesActivityRow[]) {
  const people = new Set(activities.map((a) => a.actor_id));
  const created = activities.filter((a) => a.action_type.endsWith("_created")).length;
  const notes = activities.filter((a) => a.action_type.endsWith("_update_added")).length;
  const edits = activities.filter(
    (a) =>
      a.action_type.endsWith("_updated") ||
      a.action_type === "quote_revised" ||
      a.action_type === "pipeline_status_changed"
  ).length;
  return { total: activities.length, people: people.size, created, notes, edits };
}

export function SalesActivityFeed({ activities }: { activities: SalesActivityRow[] }) {
  if (activities.length === 0) {
    return (
      <EmptyState
        icon={Activity}
        title="No real activity in this period"
        description="Only create/edit actions appear here — empty saves are ignored. Try another date range."
      />
    );
  }

  const brief = buildBrief(activities);
  const groups: { heading: string; items: SalesActivityRow[] }[] = [];
  for (const row of activities) {
    const heading = dayHeading(row.created_at);
    const last = groups[groups.length - 1];
    if (last && last.heading === heading) last.items.push(row);
    else groups.push({ heading, items: [row] });
  }

  return (
    <div className="space-y-6">
      {/* Director scan strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: "Actions", value: brief.total },
          { label: "Sales active", value: brief.people },
          { label: "Created", value: brief.created },
          { label: "Edits / revise", value: brief.edits },
          { label: "Progress notes", value: brief.notes },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-3 text-center sm:text-left"
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{s.label}</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-8">
        {groups.map((group) => (
          <section key={group.heading}>
            <div className="sticky top-0 z-[1] -mx-1 mb-3 flex items-center justify-between gap-3 bg-[var(--background,#f8fafc)]/95 px-1 py-2 backdrop-blur-sm">
              <h2 className="text-sm font-bold tracking-tight text-slate-900">{group.heading}</h2>
              <span className="rounded-full bg-slate-200/80 px-2.5 py-0.5 text-[11px] font-bold tabular-nums text-slate-600">
                {group.items.length} {group.items.length === 1 ? "action" : "actions"}
              </span>
            </div>

            <ol className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
              {group.items.map((row, idx) => {
                const href = entityHref(row);
                const meta = metaFor(row.action_type);
                const Icon = meta.icon;
                const chips = detailChips(row.details);
                const entityKind =
                  row.entity_type === "pipeline"
                    ? "Pipeline"
                    : row.entity_type === "prospect"
                      ? "Prospect"
                      : null;

                return (
                  <li
                    key={row.id}
                    className={`grid gap-3 px-4 py-3.5 sm:grid-cols-[4.5rem_1fr_auto] sm:items-start sm:gap-4 sm:px-5 ${
                      idx > 0 ? "border-t border-slate-100" : ""
                    }`}
                  >
                    <time
                      className="pt-0.5 text-sm font-bold tabular-nums text-slate-500"
                      dateTime={row.created_at}
                      title={format(new Date(row.created_at), "dd MMM yyyy, HH:mm")}
                    >
                      {format(new Date(row.created_at), "HH:mm")}
                    </time>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">
                          {row.actor_name ?? "Unknown sales"}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ring-1 ${meta.tone}`}
                        >
                          <Icon className="h-3 w-3" />
                          {meta.verb}
                          {entityKind ? ` · ${entityKind}` : ""}
                        </span>
                      </div>

                      <p className="mt-1.5 text-sm leading-snug text-slate-800">{row.summary}</p>

                      {chips.length > 0 && (
                        <ul className="mt-2 flex flex-wrap gap-1.5">
                          {chips.map((chip) => (
                            <li
                              key={chip}
                              className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700"
                            >
                              {chip}
                            </li>
                          ))}
                        </ul>
                      )}

                      {href && (
                        <Link
                          href={href}
                          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-cyan-700 hover:text-cyan-800"
                        >
                          Open record
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      )}
                    </div>

                    <p className="hidden text-right text-[11px] tabular-nums text-slate-400 sm:block">
                      {formatDistanceToNow(new Date(row.created_at), { addSuffix: true })}
                    </p>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}
