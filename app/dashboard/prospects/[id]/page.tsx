import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft, Edit, Target } from "lucide-react";
import { ProspectForm } from "@/components/ProspectForm";
import { ProspectUpdatesSection } from "@/components/ProspectUpdatesSection";
import { ProspectStatusBadge } from "@/components/ProspectStatusBadge";
import { PageHeader } from "@/components/ui/PageHeader";
import { getSupabase } from "@/lib/auth";
import { customerDetailPath } from "@/lib/customerPaths";
import type { ProspectStatus } from "@/lib/types/database";
import { formatPicWithSalutation } from "@/lib/types/database";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await getSupabase();
  const { data } = await supabase.from("prospects").select("title").eq("id", id).maybeSingle();
  if (!data) return { title: "Prospect | Enercon Sales Tracker" };
  return { title: `${data.title} | Enercon Sales Tracker` };
}

export default async function ProspectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { id } = await params;
  const { edit } = await searchParams;
  const supabase = await getSupabase();

  const { data: prospect, error } = await supabase
    .from("prospects")
    .select(
      `
      id,
      created_at,
      updated_at,
      customer_id,
      title,
      work_description,
      pic_name,
      pic_salutation,
      status,
      latest_update,
      sales_id,
      customers ( id, name, slug )
    `
    )
    .eq("id", id)
    .single();

  if (error || !prospect) {
    notFound();
  }

  const [{ data: updates }, { data: profile }, { data: customers }] = await Promise.all([
    supabase
      .from("prospect_updates")
      .select("id, content, created_at, created_by")
      .eq("prospect_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("display_name, full_name")
      .eq("id", prospect.sales_id)
      .single(),
    supabase
      .from("customers")
      .select("id, name, customer_pics ( id, nama )")
      .order("name"),
  ]);

  const authorIds = [...new Set((updates ?? []).map((u) => u.created_by).filter(Boolean))] as string[];
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

  const isEdit = edit === "true";
  const customer = Array.isArray(prospect.customers) ? prospect.customers[0] : prospect.customers;
  const salesName = profile?.display_name ?? profile?.full_name ?? "—";
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/dashboard/prospects" className="btn-ghost gap-2 px-2 text-slate-600">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        {!isEdit && (
          <Link href={`/dashboard/prospects/${id}?edit=true`} className="btn-secondary gap-2">
            <Edit className="h-4 w-4" />
            Edit
          </Link>
        )}
      </div>

      {isEdit ? (
        <div className="card-elevated p-5 sm:p-6">
          <h1 className="mb-6 text-xl font-bold text-slate-900">Edit Prospect</h1>
          <ProspectForm
            customers={customersNormalized}
            backPath={`/dashboard/prospects/${id}`}
            prospect={{
              id: prospect.id,
              customer_id: prospect.customer_id,
              title: prospect.title,
              work_description: prospect.work_description,
              pic_name: prospect.pic_name,
              pic_salutation: prospect.pic_salutation,
              status: prospect.status as ProspectStatus,
            }}
          />
        </div>
      ) : (
        <>
          <PageHeader
            icon={Target}
            title={prospect.title}
            description={`Created ${format(new Date(prospect.created_at), "dd MMM yyyy")}`}
            actions={<ProspectStatusBadge value={prospect.status} />}
          />

          <div className="card-elevated grid gap-6 p-5 sm:grid-cols-2 sm:p-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Customer
              </p>
              {customer ? (
                <Link
                  href={customerDetailPath({
                    id: customer.id,
                    slug: customer.slug,
                    name: customer.name,
                  })}
                  className="mt-1 inline-block font-medium text-cyan-700 hover:underline"
                >
                  {customer.name}
                </Link>
              ) : (
                <p className="mt-1 text-slate-800">—</p>
              )}
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">PIC</p>
              <p className="mt-1 font-medium text-slate-800">
                {formatPicWithSalutation(prospect.pic_salutation, prospect.pic_name)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Sales
              </p>
              <p className="mt-1 font-medium text-slate-800">{salesName}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Work description
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                {prospect.work_description?.trim() || "—"}
              </p>
            </div>
          </div>

          <ProspectUpdatesSection
            prospectId={prospect.id}
            prospectCreatedAt={prospect.created_at}
            prospectLabel={prospect.title}
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
