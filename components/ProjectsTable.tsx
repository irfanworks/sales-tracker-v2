"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ExternalLink, Trash2, Loader2, FolderKanban } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ProgressBadge } from "@/components/ProgressBadge";
import { ProspectBadge } from "@/components/ProspectBadge";
import { OutcomeBadge } from "@/components/OutcomeBadge";
import { projectDetailPath } from "@/lib/projectPaths";
import { customerDetailPath } from "@/lib/customerPaths";
import { EmptyState } from "@/components/ui/EmptyState";

const linkClass =
  "font-medium text-cyan-700 transition hover:text-cyan-800 hover:underline";

interface ProjectRow {
  id: string;
  slug?: string | null;
  created_at: string;
  no_quote: string;
  project_name: string;
  customer_id: string;
  value: number | null;
  progress_type: string;
  outcome_status?: string | null;
  prospect: string;
  weekly_update: string | null;
  target_closing_at?: string | null;
  sales_id: string;
  customer?: { id: string; name: string; slug?: string | null };
  sales_name?: string | null;
}

function formatIdr(value: number | null) {
  if (value == null) return "—";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

export function ProjectsTable({
  projects,
  emptyMessage,
}: {
  projects: ProjectRow[];
  emptyMessage?: string;
}) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allSelected = projects.length > 0 && selectedIds.size === projects.length;
  const someSelected = selectedIds.size > 0;

  function toggleSelectAll() {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(projects.map((p) => p.id)));
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleDelete(id: string) {
    setError(null);
    setDeletingId(id);
    const supabase = createClient();
    const { error: deleteError } = await supabase.from("projects").delete().eq("id", id);
    setDeletingId(null);
    if (deleteError) setError(deleteError.message);
    else router.refresh();
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;
    setError(null);
    setBulkDeleting(true);
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("projects")
      .delete()
      .in("id", Array.from(selectedIds));
    setBulkDeleting(false);
    if (deleteError) setError(deleteError.message);
    else {
      setSelectedIds(new Set());
      router.refresh();
    }
  }

  if (projects.length === 0) {
    return (
      <EmptyState
        icon={FolderKanban}
        title="No projects yet"
        description={emptyMessage ?? "Create your first project to start tracking the pipeline."}
        action={
          !emptyMessage && (
            <Link href="/dashboard/projects/new" className="btn-primary">
              Create project
            </Link>
          )
        }
      />
    );
  }

  const toolbar = (
    <>
      {error && (
        <div className="border-b border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>
      )}
      {someSelected && (
        <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50/90 px-4 py-2.5">
          <span className="text-sm font-medium text-slate-600">{selectedIds.size} selected</span>
          <button
            type="button"
            onClick={handleBulkDelete}
            disabled={bulkDeleting}
            className="btn-secondary gap-2 text-red-700 hover:border-red-200 hover:bg-red-50"
          >
            {bulkDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Delete selected
          </button>
        </div>
      )}
    </>
  );

  return (
    <div>
      {toolbar}

      {/* Mobile cards */}
      <div className="divide-y divide-slate-100 md:hidden">
        {projects.map((p) => (
          <div key={p.id} className="p-4 transition hover:bg-slate-50/50">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={selectedIds.has(p.id)}
                onChange={() => toggleSelect(p.id)}
                className="mt-1 rounded border-slate-300"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      href={projectDetailPath({
                        id: p.id,
                        slug: p.slug,
                        no_quote: p.no_quote,
                        project_name: p.project_name,
                      })}
                      className={`block truncate ${linkClass}`}
                    >
                      {p.project_name}
                    </Link>
                    <p className="mt-0.5 font-mono text-xs text-slate-500">{p.no_quote}</p>
                  </div>
                  <p className="shrink-0 text-sm font-bold text-slate-800">{formatIdr(p.value)}</p>
                </div>
                <p className="mt-1 text-sm">
                  {p.customer ? (
                    <Link
                      href={customerDetailPath(p.customer)}
                      className={linkClass}
                    >
                      {p.customer.name}
                    </Link>
                  ) : (
                    <span className="text-slate-600">—</span>
                  )}
                </p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <ProgressBadge value={p.progress_type} />
                  <ProspectBadge value={p.prospect} />
                  <OutcomeBadge value={p.outcome_status} />
                </div>
                <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                  <span>{p.sales_name ?? "—"}</span>
                  <span>{format(new Date(p.created_at), "dd MMM yyyy")}</span>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <Link
                    href={projectDetailPath({
                      id: p.id,
                      slug: p.slug,
                      no_quote: p.no_quote,
                      project_name: p.project_name,
                    })}
                    className="inline-flex items-center gap-1 text-sm font-medium text-cyan-700"
                  >
                    View <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(p.id)}
                    disabled={deletingId === p.id}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    title="Delete"
                  >
                    {deletingId === p.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="table-header-row">
              <th className="w-10 px-3 py-3.5">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="rounded border-slate-300"
                />
              </th>
              <th className="whitespace-nowrap px-4 py-3.5">No Quote</th>
              <th className="whitespace-nowrap px-4 py-3.5">Project</th>
              <th className="whitespace-nowrap px-4 py-3.5">Customer</th>
              <th className="whitespace-nowrap px-4 py-3.5">Value</th>
              <th className="whitespace-nowrap px-4 py-3.5">Progress</th>
              <th className="whitespace-nowrap px-4 py-3.5">Prospect</th>
              <th className="whitespace-nowrap px-4 py-3.5">Outcome</th>
              <th className="whitespace-nowrap px-4 py-3.5">Sales</th>
              <th className="whitespace-nowrap px-4 py-3.5">Date</th>
              <th className="whitespace-nowrap px-4 py-3.5">Target closing</th>
              <th className="w-24 px-4 py-3.5" />
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.id} className="table-row">
                <td className="w-10 px-3 py-3.5">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(p.id)}
                    onChange={() => toggleSelect(p.id)}
                    className="rounded border-slate-300"
                  />
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 font-mono text-slate-600">{p.no_quote}</td>
                <td className="min-w-[120px] px-4 py-3.5">
                  <Link
                    href={projectDetailPath({
                      id: p.id,
                      slug: p.slug,
                      no_quote: p.no_quote,
                      project_name: p.project_name,
                    })}
                    className={`block max-w-[200px] truncate ${linkClass}`}
                    title={p.project_name}
                  >
                    {p.project_name}
                  </Link>
                </td>
                <td className="min-w-[100px] px-4 py-3.5">
                  {p.customer ? (
                    <Link
                      href={customerDetailPath(p.customer)}
                      className={`block max-w-[160px] truncate ${linkClass}`}
                      title={p.customer.name}
                    >
                      {p.customer.name}
                    </Link>
                  ) : (
                    <span className="text-slate-600">—</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 font-medium tabular-nums text-slate-800">
                  {formatIdr(p.value)}
                </td>
                <td className="whitespace-nowrap px-4 py-3.5">
                  <ProgressBadge value={p.progress_type} />
                </td>
                <td className="whitespace-nowrap px-4 py-3.5">
                  <ProspectBadge value={p.prospect} />
                </td>
                <td className="whitespace-nowrap px-4 py-3.5">
                  <OutcomeBadge value={p.outcome_status} />
                </td>
                <td className="min-w-[80px] px-4 py-3.5 text-slate-600">{p.sales_name ?? "—"}</td>
                <td className="whitespace-nowrap px-4 py-3.5 text-slate-500">
                  {format(new Date(p.created_at), "dd MMM yyyy")}
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-slate-500">
                  {p.target_closing_at
                    ? format(new Date(p.target_closing_at + "T00:00:00"), "dd MMM yyyy")
                    : "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-3.5">
                  <div className="flex items-center gap-1">
                    <Link
                      href={projectDetailPath({
                        id: p.id,
                        slug: p.slug,
                        no_quote: p.no_quote,
                        project_name: p.project_name,
                      })}
                      className="btn-ghost gap-1 px-2 py-1.5 text-cyan-700 hover:bg-cyan-50"
                    >
                      View <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(p.id)}
                      disabled={deletingId === p.id}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      title="Delete"
                    >
                      {deletingId === p.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
