import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft, Edit } from "lucide-react";
import { PipelineForm } from "@/components/PipelineForm";
import { PipelineUpdatesSection } from "@/components/PipelineUpdatesSection";
import { QuoteRevisePanel } from "@/components/QuoteRevisePanel";
import { QuoteRevisionsHistory } from "@/components/QuoteRevisionsHistory";
import { DownloadQuotationButton } from "@/components/DownloadQuotationButton";
import { ProgressBadge } from "@/components/ProgressBadge";
import { ProspectBadge } from "@/components/ProspectBadge";
import { OutcomeBadge } from "@/components/OutcomeBadge";
import { PipelineTypeBadge } from "@/components/PipelineTypeBadge";
import { PipelineStatusToggle } from "@/components/PipelineStatusToggle";
import { PageHeader } from "@/components/ui/PageHeader";
import { PROGRESS_TYPES, PROSPECT_OPTIONS, formatPicWithSalutation } from "@/lib/types/database";
import type { LifecycleStatus, PaymentTermLine, PipelineType, QuoteRevision } from "@/lib/types/database";
import { ensurePipelineSlug, getPipelineBySlugOrId } from "@/lib/pipelines";
import { pipelineDetailPath } from "@/lib/pipelinePaths";
import { getSupabase } from "@/lib/auth";
import { isUuid } from "@/lib/isUuid";
import { FolderKanban } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { project } = await getPipelineBySlugOrId(id);
  if (!project) return { title: "Project | Enercon Sales Tracker" };
  return { title: `${project.pipeline_name} | Enercon Sales Tracker` };
}

function parsePaymentTerms(raw: unknown): PaymentTermLine[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((t) => ({
    label: String((t as PaymentTermLine)?.label ?? ""),
    percent: Number((t as PaymentTermLine)?.percent) || 0,
    is_custom: Boolean((t as PaymentTermLine)?.is_custom),
  }));
}

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { id: slugOrId } = await params;
  const { edit } = await searchParams;
  const { project: projectRow, error: lookupError } = await getPipelineBySlugOrId(slugOrId);

  if (lookupError || !projectRow) {
    notFound();
  }

  const canonicalSlug = await ensurePipelineSlug({
    id: projectRow.id as string,
    no_quote: projectRow.no_quote as string,
    pipeline_name: projectRow.pipeline_name as string,
    slug: projectRow.slug as string | null,
  });

  if (isUuid(slugOrId)) {
    redirect(`/dashboard/pipeline/${canonicalSlug}${edit === "true" ? "?edit=true" : ""}`);
  }

  const projectId = projectRow.id as string;
  const supabase = await getSupabase();

  const selectCols = `
    id,
    slug,
    created_at,
    no_quote,
    quote_base,
    quote_revision,
    pipeline_name,
    customer_id,
    value,
    pipeline_type,
    status,
    progress_type,
    outcome_status,
    prospect,
    target_closing_at,
    pic_name,
    pic_salutation,
    price_validity_days,
    delivery_weeks,
    payment_terms,
    sales_id,
    customers ( id, name )
  `;

  const { data: project, error: projectError } = await supabase
    .from("pipelines")
    .select(selectCols)
    .eq("id", projectId)
    .single();

  if (projectError || !project) {
    notFound();
  }

  const paymentTerms = parsePaymentTerms(project.payment_terms);
  const detailPath = pipelineDetailPath({
    id: project.id,
    slug: canonicalSlug,
    no_quote: project.no_quote,
    pipeline_name: project.pipeline_name,
  });

  const listPath = "/dashboard/pipeline";

  const [{ data: updates }, { data: revisionRows }] = await Promise.all([
    supabase
      .from("pipeline_updates")
      .select("id, content, created_at, created_by")
      .eq("pipeline_id", projectId)
      .order("created_at", { ascending: false }),
    supabase
      .from("quote_revisions")
      .select(
        "id, pipeline_id, revision, no_quote, value, price_validity_days, delivery_weeks, payment_terms, pipeline_name, notes, created_at, created_by"
      )
      .eq("pipeline_id", projectId)
      .order("revision", { ascending: false }),
  ]);

  const authorIds = [
    ...new Set(
      [
        ...(updates ?? []).map((u) => u.created_by),
        ...(revisionRows ?? []).map((r) => r.created_by),
      ].filter(Boolean)
    ),
  ] as string[];
  const authorNames: Record<string, string> = {};

  if (authorIds.length > 0) {
    const { data: authors } = await supabase
      .from("profiles")
      .select("id, display_name, full_name")
      .in("id", authorIds);
    (authors ?? []).forEach((a) => {
      authorNames[a.id] = a.display_name ?? a.full_name ?? "Unknown";
    });
  }

  const revisions: QuoteRevision[] = (revisionRows ?? []).map((r) => ({
    id: r.id,
    pipeline_id: r.pipeline_id,
    revision: r.revision,
    no_quote: r.no_quote,
    value: r.value != null ? Number(r.value) : null,
    price_validity_days: r.price_validity_days,
    delivery_weeks: r.delivery_weeks,
    payment_terms: parsePaymentTerms(r.payment_terms),
    pipeline_name: r.pipeline_name,
    notes: r.notes,
    created_at: r.created_at,
    created_by: r.created_by,
    author_name: r.created_by ? authorNames[r.created_by] ?? null : null,
  }));

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, full_name")
    .eq("id", project.sales_id)
    .single();

  const { data: customers } = await supabase
    .from("customers")
    .select("id, name, customer_pics ( id, nama )")
    .order("name");

  const customersNormalized = (customers ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    pics: Array.isArray(c.customer_pics)
      ? c.customer_pics.map((p: { id: string; nama: string | null }) => ({
          id: p.id,
          nama: p.nama,
        }))
      : [],
  }));

  const isEdit = edit === "true";
  const customer = Array.isArray(project.customers) ? project.customers[0] : project.customers;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link href={listPath} className="btn-ghost gap-2 px-2 text-slate-600">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        {!isEdit && (
          <Link href={`${detailPath}?edit=true`} className="btn-secondary gap-2">
            <Edit className="h-4 w-4" />
            Edit
          </Link>
        )}
      </div>

      {isEdit ? (
        <div className="pipeline-form-card p-4 sm:p-6 md:p-8">
          <h1 className="pipeline-page-title mb-6">Edit Pipeline</h1>
          <PipelineForm
            customers={customersNormalized}
            progressTypes={PROGRESS_TYPES}
            prospectOptions={PROSPECT_OPTIONS}
            backPath={detailPath}
            project={{
              id: project.id,
              no_quote: project.no_quote,
              pipeline_name: project.pipeline_name,
              customer_id: project.customer_id,
              value: project.value != null ? Number(project.value) : null,
              pipeline_type: (project.pipeline_type as PipelineType) ?? "Project",
              progress_type: project.progress_type,
              outcome_status: project.outcome_status,
              prospect: project.prospect,
              target_closing_at: project.target_closing_at ?? null,
              pic_name: project.pic_name ?? null,
              pic_salutation: project.pic_salutation ?? null,
              price_validity_days: project.price_validity_days,
              delivery_weeks: project.delivery_weeks,
              payment_terms: paymentTerms,
            }}
          />
          <p className="pipeline-hint mt-8 border-t border-slate-100 pt-5">
            Tender value and commercial terms are changed via <strong>Revisi Quote</strong> on the
            detail page so history stays accurate. Progress updates are never overwritten here.
          </p>
        </div>
      ) : (
        <>
          <PageHeader
            icon={FolderKanban}
            title={project.pipeline_name}
            description={`${project.no_quote} · Created ${format(new Date(project.created_at), "dd MMM yyyy")}`}
            actions={
              <>
                <DownloadQuotationButton pipelineIdOrSlug={canonicalSlug} />
                <QuoteRevisePanel
                  project={{
                    id: project.id,
                    no_quote: project.no_quote,
                    quote_base: project.quote_base,
                    quote_revision: project.quote_revision ?? 0,
                    pipeline_name: project.pipeline_name,
                    value: project.value != null ? Number(project.value) : null,
                    price_validity_days: project.price_validity_days,
                    delivery_weeks: project.delivery_weeks,
                    payment_terms: paymentTerms,
                    slug: canonicalSlug,
                  }}
                />
              </>
            }
          />

          <div className="card-elevated overflow-hidden">
            <dl className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Customer
                </dt>
                <dd className="mt-1 font-medium text-slate-900">
                  {(customer as { name: string })?.name ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">PIC</dt>
                <dd className="mt-1 font-medium text-slate-900">
                  {formatPicWithSalutation(project.pic_salutation, project.pic_name)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  No Quote
                </dt>
                <dd className="mt-1 font-mono font-semibold text-slate-900">{project.no_quote}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Tender value
                </dt>
                <dd className="mt-1 font-medium tabular-nums text-slate-900">
                  {project.value != null
                    ? new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        minimumFractionDigits: 0,
                      }).format(Number(project.value))
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Price validity
                </dt>
                <dd className="mt-1 text-slate-800">
                  {project.price_validity_days != null
                    ? `${project.price_validity_days} days`
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Delivery
                </dt>
                <dd className="mt-1 text-slate-800">
                  {project.delivery_weeks != null ? `${project.delivery_weeks} weeks` : "—"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Payment terms
                </dt>
                <dd className="mt-1">
                  {paymentTerms.length === 0 ? (
                    <span className="text-slate-500">—</span>
                  ) : (
                    <ul className="max-w-md space-y-1 text-sm text-slate-800">
                      {paymentTerms.map((t, i) => (
                        <li key={`${t.label}-${i}`} className="flex justify-between gap-4">
                          <span>{t.label}</span>
                          <span className="tabular-nums font-medium">{t.percent}%</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">Type</dt>
                <dd className="mt-1">
                  <PipelineTypeBadge value={project.pipeline_type ?? "Project"} />
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Progress Type
                </dt>
                <dd className="mt-1">
                  <ProgressBadge value={project.progress_type} />
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Outcome
                </dt>
                <dd className="mt-1">
                  <OutcomeBadge value={project.outcome_status} />
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Prospect
                </dt>
                <dd className="mt-1">
                  <ProspectBadge value={project.prospect} />
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">Sales</dt>
                <dd className="mt-1 text-slate-700">
                  {profile?.display_name ?? profile?.full_name ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Target closing
                </dt>
                <dd className="mt-1 text-slate-800">
                  {project.target_closing_at
                    ? format(new Date(project.target_closing_at + "T00:00:00"), "dd MMM yyyy")
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Status
                </dt>
                <dd className="mt-1">
                  <PipelineStatusToggle
                    projectId={project.id}
                    status={
                      (project.status === "Closed" ? "Closed" : "Open") as LifecycleStatus
                    }
                    pipelineLabel={`${project.no_quote} · ${project.pipeline_name}`}
                  />
                </dd>
              </div>
            </dl>
          </div>

          <QuoteRevisionsHistory
            current={{
              no_quote: project.no_quote,
              quote_revision: project.quote_revision ?? 0,
              value: project.value != null ? Number(project.value) : null,
              price_validity_days: project.price_validity_days,
              delivery_weeks: project.delivery_weeks,
              payment_terms: paymentTerms,
            }}
            revisions={revisions}
          />

          <PipelineUpdatesSection
            projectId={projectId}
            projectCreatedAt={project.created_at}
            pipelineLabel={`${project.no_quote} · ${project.pipeline_name}`}
            updates={(updates ?? []).map((u) => ({
              id: u.id,
              content: u.content,
              created_at: u.created_at,
              created_by: u.created_by,
              author_name: u.created_by ? authorNames[u.created_by] ?? null : null,
            }))}
          />
        </>
      )}
    </div>
  );
}
