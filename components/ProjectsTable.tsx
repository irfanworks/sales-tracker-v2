"use client";

import Link from "next/link";
import { format } from "date-fns";
import { ExternalLink } from "lucide-react";
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
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/80">
            <th className="whitespace-nowrap px-3 py-3 font-medium text-slate-700 sm:px-4">No Quote</th>
            <th className="whitespace-nowrap px-3 py-3 font-medium text-slate-700 sm:px-4">Project</th>
            <th className="whitespace-nowrap px-3 py-3 font-medium text-slate-700 sm:px-4">Customer</th>
            <th className="whitespace-nowrap px-3 py-3 font-medium text-slate-700 sm:px-4">Value</th>
            <th className="whitespace-nowrap px-3 py-3 font-medium text-slate-700 sm:px-4">Progress</th>
            <th className="whitespace-nowrap px-3 py-3 font-medium text-slate-700 sm:px-4">Prospect</th>
            <th className="whitespace-nowrap px-3 py-3 font-medium text-slate-700 sm:px-4">Sales</th>
            <th className="whitespace-nowrap px-3 py-3 font-medium text-slate-700 sm:px-4">Date</th>
            <th className="whitespace-nowrap px-3 py-3 font-medium text-slate-700 sm:px-4"></th>
          </tr>
        </thead>
        <tbody>
          {projects.map((p) => (
            <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/50">
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
                <Link
                  href={`/dashboard/projects/${p.id}`}
                  className="inline-flex items-center gap-1 text-cyan-700 hover:underline"
                >
                  View <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
