"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ExternalLink, Trash2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ProgressBadge } from "@/components/ProgressBadge";
import { ProspectBadge } from "@/components/ProspectBadge";

interface ProjectRow {
  id: string;
  created_at: string;
  no_quote: string;
  project_name: string;
  customer_id: string;
  value: number;
  progress_type: string;
  prospect: string;
  weekly_update: string | null;
  sales_id: string;
  customer?: { id: string; name: string };
  sales_name?: string | null;
}

export function ProjectsTable({ projects }: { projects: ProjectRow[] }) {
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
      <div className="p-8 text-center text-slate-500">
        No projects yet.{" "}
        <Link href="/dashboard/projects/new" className="text-cyan-700 hover:underline">
          Create one
        </Link>
      </div>
    );
  }

  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      {error && (
        <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      {someSelected && (
        <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2">
          <span className="text-sm text-slate-600">{selectedIds.size} selected</span>
          <button
            type="button"
            onClick={handleBulkDelete}
            disabled={bulkDeleting}
            className="btn-secondary gap-2 text-red-700 hover:bg-red-50 hover:text-red-800"
          >
            {bulkDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Delete selected
          </button>
        </div>
      )}
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/80">
            <th className="w-10 px-2 py-3 sm:px-4">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleSelectAll}
                className="rounded border-slate-300"
              />
            </th>
            <th className="whitespace-nowrap px-3 py-3 font-medium text-slate-700 sm:px-4">No Quote</th>
            <th className="whitespace-nowrap px-3 py-3 font-medium text-slate-700 sm:px-4">Project</th>
            <th className="whitespace-nowrap px-3 py-3 font-medium text-slate-700 sm:px-4">Customer</th>
            <th className="whitespace-nowrap px-3 py-3 font-medium text-slate-700 sm:px-4">Value</th>
            <th className="whitespace-nowrap px-3 py-3 font-medium text-slate-700 sm:px-4">Progress</th>
            <th className="whitespace-nowrap px-3 py-3 font-medium text-slate-700 sm:px-4">Prospect</th>
            <th className="whitespace-nowrap px-3 py-3 font-medium text-slate-700 sm:px-4">Sales</th>
            <th className="whitespace-nowrap px-3 py-3 font-medium text-slate-700 sm:px-4">Date</th>
            <th className="whitespace-nowrap px-3 py-3 font-medium text-slate-700 sm:px-4 w-24"></th>
          </tr>
        </thead>
        <tbody>
          {projects.map((p) => (
            <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/50">
              <td className="w-10 px-2 py-3 sm:px-4">
                <input
                  type="checkbox"
                  checked={selectedIds.has(p.id)}
                  onChange={() => toggleSelect(p.id)}
                  className="rounded border-slate-300"
                />
              </td>
              <td className="whitespace-nowrap px-3 py-3 font-mono text-slate-700 sm:px-4">{p.no_quote}</td>
              <td className="min-w-[120px] px-3 py-3 text-slate-800 sm:px-4">{p.project_name}</td>
              <td className="min-w-[100px] px-3 py-3 text-slate-600 sm:px-4">{p.customer?.name ?? "—"}</td>
              <td className="whitespace-nowrap px-3 py-3 text-slate-700 sm:px-4">
                {new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  minimumFractionDigits: 0,
                }).format(p.value)}
              </td>
              <td className="whitespace-nowrap px-3 py-3 sm:px-4">
                <ProgressBadge value={p.progress_type} />
              </td>
              <td className="whitespace-nowrap px-3 py-3 sm:px-4">
                <ProspectBadge value={p.prospect} />
              </td>
              <td className="min-w-[80px] px-3 py-3 text-slate-600 sm:px-4">{p.sales_name ?? "—"}</td>
              <td className="whitespace-nowrap px-3 py-3 text-slate-500 sm:px-4">
                {format(new Date(p.created_at), "dd MMM yyyy")}
              </td>
              <td className="whitespace-nowrap px-3 py-3 sm:px-4">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/projects/${p.id}`}
                    className="inline-flex items-center gap-1 text-cyan-700 hover:underline"
                  >
                    View <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(p.id)}
                    disabled={deletingId === p.id}
                    className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    title="Delete"
                  >
                    {deletingId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
