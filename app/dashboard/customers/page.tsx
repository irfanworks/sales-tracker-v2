import Link from "next/link";
import { getSupabase } from "@/lib/auth";
import { CustomersTable } from "@/components/CustomersTable";
import { AddCustomerPanel } from "@/components/AddCustomerPanel";
import { ExportCustomersButton } from "@/components/ExportCustomersButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { Users } from "lucide-react";
import type { Customer, CustomerPic } from "@/lib/types/database";
import { slugWithId } from "@/lib/slugify";

export const CUSTOMERS_PAGE_SIZE = 50;

function sanitizeCustomerSearch(raw: string | undefined) {
  if (!raw) return "";
  return raw
    .trim()
    .replace(/[%_,()]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const raw = await searchParams;
  const q = sanitizeCustomerSearch(raw.q);
  const page = Math.max(1, Number.parseInt(raw.page ?? "1", 10) || 1);
  const from = (page - 1) * CUSTOMERS_PAGE_SIZE;
  const to = from + CUSTOMERS_PAGE_SIZE - 1;

  const supabase = await getSupabase();

  let listQuery = supabase
    .from("customers")
    .select(
      `
      id,
      name,
      slug,
      sector,
      customer_role,
      created_at,
      customer_pics ( id, nama, email, no_hp, jabatan )
    `,
      { count: "exact" }
    )
    .order("name")
    .range(from, to);

  if (q) {
    listQuery = listQuery.or(
      `name.ilike.%${q}%,sector.ilike.%${q}%,customer_role.ilike.%${q}%`
    );
  }

  const { data: customers, error, count } = await listQuery;
  if (error) {
    return (
      <div className="card p-6">
        <p className="text-red-600">Error loading customers. Please try again.</p>
      </div>
    );
  }

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / CUSTOMERS_PAGE_SIZE));

  const normalized: (Customer & { pics: CustomerPic[] })[] = (customers ?? []).map((c) => {
    const pics = Array.isArray(c.customer_pics) ? c.customer_pics : [];
    const slug = c.slug ?? slugWithId(c.name, c.id);
    return {
      id: c.id,
      name: c.name,
      slug,
      sector: c.sector ?? null,
      customer_role: c.customer_role ?? null,
      created_at: c.created_at,
      pics: pics.map(
        (p: {
          id?: string;
          nama: string | null;
          email?: string | null;
          no_hp?: string | null;
          jabatan?: string | null;
        }): CustomerPic => ({
          id: p.id,
          customer_id: c.id,
          nama: p.nama,
          email: p.email ?? null,
          no_hp: p.no_hp ?? null,
          jabatan: p.jabatan ?? null,
        })
      ),
    };
  });

  const exportQuery = q ? new URLSearchParams({ q }).toString() : "";

  function pageHref(nextPage: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (nextPage > 1) params.set("page", String(nextPage));
    const s = params.toString();
    return s ? `/dashboard/customers?${s}` : "/dashboard/customers";
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        icon={Users}
        title="Customers"
        description="Master data customer. Sector and customer role are optional. At least one PIC (name) is required."
        actions={<ExportCustomersButton exportQuery={exportQuery} disabled={total === 0} />}
      />

      <form className="flex flex-wrap gap-2" action="/dashboard/customers" method="get">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search name, sector, or role…"
          className="input-field max-w-md flex-1"
          autoComplete="off"
        />
        <button type="submit" className="btn-secondary">
          Search
        </button>
        {q ? (
          <Link href="/dashboard/customers" className="btn-ghost">
            Clear
          </Link>
        ) : null}
      </form>

      <AddCustomerPanel />
      <div className="table-shell">
        <CustomersTable customers={normalized} />
      </div>

      {totalPages > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
          <p>
            Showing {from + 1}–{Math.min(to + 1, total)} of {total}
          </p>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link href={pageHref(page - 1)} className="btn-secondary">
                Previous
              </Link>
            ) : null}
            {page < totalPages ? (
              <Link href={pageHref(page + 1)} className="btn-secondary">
                Next
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
