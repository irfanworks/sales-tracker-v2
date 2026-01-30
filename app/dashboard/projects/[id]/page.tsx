import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft, Edit } from "lucide-react";
import { ProjectForm } from "@/components/ProjectForm";
import { ProjectUpdateHistory } from "@/components/ProjectUpdateHistory";
import { AddProjectUpdate } from "@/components/AddProjectUpdate";
import { ProgressBadge } from "@/components/ProgressBadge";
import { ProspectBadge } from "@/components/ProspectBadge";
import { PROGRESS_TYPES, PROSPECT_OPTIONS } from "@/lib/types/database";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: project } = await supabase.from("projects").select("project_name").eq("id", id).single();
  if (!project) return { title: "Project | Enercon Sales Tracker" };
  return { title: `${project.project_name} | Enercon Sales Tracker` };
}

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { id } = await params;
  const { edit } = await searchParams;
  const supabase = await createClient();

  const selectCols = `
    id,
    created_at,
    no_quote,
    project_name,
    customer_id,
    value,
    progress_type,
    prospect,
    weekly_update,
    sales_id,
    customers ( id, name )
  `;

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select(selectCols)
    .eq("id", id)
    .single();

  if (projectError || !project) {
    notFound();
  }

  const { data: updates } = await supabase
    .from("project_updates")
    .select("id, content, created_at, created_by")
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, full_name")
    .eq("id", project.sales_id)
    .single();

  const { data: customers } = await supabase
    .from("customers")
    .select("id, name")
    .order("name");

  const isEdit = edit === "true";
  const customer = Array.isArray(project.customers) ? project.customers[0] : project.customers;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          {!isEdit && (
            <Link
              href={`/dashboard/projects/${id}?edit=true`}
              className="btn-secondary gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Link>
          )}
        </div>
      </div>

      {isEdit ? (
        <div className="card p-6">
          <h1 className="mb-6 text-xl font-semibold text-slate-800">Edit Project</h1>
          <ProjectForm
            customers={customers ?? []}
            progressTypes={PROGRESS_TYPES}
            prospectOptions={PROSPECT_OPTIONS}
            project={{
              id: project.id,
              no_quote: project.no_quote,
              project_name: project.project_name,
              customer_id: project.customer_id,
              value: Number(project.value),
              progress_type: project.progress_type,
              prospect: project.prospect,
              weekly_update: project.weekly_update,
            }}
          />
        </div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-4 sm:px-6">
              <h1 className="text-lg font-semibold text-slate-800 sm:text-xl">{project.project_name}</h1>
              <p className="mt-1 text-sm text-slate-600">
                {project.no_quote} · {format(new Date(project.created_at), "dd MMM yyyy")}
              </p>
            </div>
            <dl className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6">
              <div>
                <dt className="text-xs font-medium uppercase text-slate-500">Customer</dt>
                <dd className="mt-1 text-slate-800">{(customer as { name: string })?.name ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase text-slate-500">Value</dt>
                <dd className="mt-1 text-slate-800">
                  {new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    minimumFractionDigits: 0,
                  }).format(Number(project.value))}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase text-slate-500">Progress Type</dt>
                <dd className="mt-1">
                  <ProgressBadge value={project.progress_type} />
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase text-slate-500">Prospect</dt>
                <dd className="mt-1">
                  <ProspectBadge value={project.prospect} />
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase text-slate-500">Sales</dt>
                <dd className="mt-1 text-slate-700">{profile?.display_name ?? profile?.full_name ?? "—"}</dd>
              </div>
              {project.weekly_update && (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium uppercase text-slate-500">
                    Latest update
                  </dt>
                  <dd className="mt-1 whitespace-pre-wrap text-slate-700">
                    {project.weekly_update}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <div className="card p-4 sm:p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">Project updates</h2>
            <ProjectUpdateHistory
              updates={(updates ?? []).map((u) => ({
                id: u.id,
                content: u.content,
                created_at: u.created_at,
                created_by: u.created_by,
              }))}
            />
            <AddProjectUpdate projectId={id} />
          </div>
        </>
      )}
    </div>
  );
}
