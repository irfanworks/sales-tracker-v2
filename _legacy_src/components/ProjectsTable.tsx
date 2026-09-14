"use client";

import Link from "next/link";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Pencil } from "lucide-react";

interface ProjectRow {
  id: string;
  created_at: string;
  no_quote: string;
  project_name: string;
  customer_id: string;
  value: number;
  status?: string;
  progress_type: string;
  prospect?: string;
  created_by?: string;
  created_by_name?: string | null;
  customers: { name: string } | null;
}

interface ProjectsTableProps {
  projects: ProjectRow[];
  latestUpdates?: Map<string, { update_text: string; created_at: string }>;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatUpdateSnippet(text: string, maxLen = 40) {
  const t = text.trim();
  if (!t) return "—";
  return t.length <= maxLen ? t : t.slice(0, maxLen) + "…";
}

export function ProjectsTable({ projects, latestUpdates = new Map() }: ProjectsTableProps) {
  if (projects.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500">
        Belum ada project.{" "}
        <Link
          href="/projects/new"
          className="text-primary-600 hover:underline font-medium"
        >
          Tambah project
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/80">
            <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              No Quote
            </th>
            <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Project
            </th>
            <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Customer
            </th>
            <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Value
            </th>
            <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Progress Type
            </th>
            <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Prospect
            </th>
            <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Sales
            </th>
            <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Update Terakhir
            </th>
            <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Tanggal
            </th>
            <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider w-24">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody>
          {projects.map((p) => {
            const lastUpdate = latestUpdates.get(p.id);
            return (
              <tr
                key={p.id}
                className="border-b border-slate-100 hover:bg-slate-50/50"
              >
                <td className="px-4 py-3 text-slate-800 font-medium">
                  {p.no_quote}
                </td>
                <td className="px-4 py-3 text-slate-700">{p.project_name}</td>
                <td className="px-4 py-3 text-slate-600">
                  {p.customers?.name ?? "—"}
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {formatCurrency(p.value)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      p.progress_type === "Win"
                        ? "bg-green-100 text-green-800"
                        : p.progress_type === "Loss"
                        ? "bg-red-100 text-red-800"
                        : p.progress_type === "Tender"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {p.progress_type}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      p.prospect === "Hot Prospect"
                        ? "bg-orange-100 text-orange-800"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {p.prospect ?? "Normal"}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600 text-sm">
                  {p.created_by_name?.trim() || "—"}
                </td>
                <td className="px-4 py-3 text-slate-600 text-sm max-w-[200px]">
                  {lastUpdate ? (
                    <span title={lastUpdate.update_text}>
                      {formatUpdateSnippet(lastUpdate.update_text)} ·{" "}
                      {format(new Date(lastUpdate.created_at), "d MMM", { locale: id })}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600 text-sm">
                  {format(new Date(p.created_at), "d MMM yyyy", { locale: id })}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/projects/${p.id}/edit`}
                    className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
