import { getSupabase } from "@/lib/auth";
import { CustomersTable } from "@/components/CustomersTable";
import { AddCustomerPanel } from "@/components/AddCustomerPanel";
import { ExportCustomersButton } from "@/components/ExportCustomersButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { Users } from "lucide-react";
import type { Customer, CustomerPic } from "@/lib/types/database";
import { slugWithId } from "@/lib/slugify";

export default async function CustomersPage() {
  const supabase = await getSupabase();
  const { data: customers, error } = await supabase
    .from("customers")
    .select(`
      id,
      name,
      slug,
      sector,
      created_at,
      customer_pics ( id, nama, email, no_hp, jabatan )
    `)
    .order("name");

  if (error) {
    return (
      <div className="card p-6">
        <p className="text-red-600">Error loading customers: {error.message}</p>
      </div>
    );
  }

  const normalized: (Customer & { pics: CustomerPic[] })[] = (customers ?? []).map((c) => {
    const pics = Array.isArray(c.customer_pics) ? c.customer_pics : [];
    const slug = c.slug ?? slugWithId(c.name, c.id);
    return {
      id: c.id,
      name: c.name,
      slug,
      sector: c.sector ?? null,
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

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        icon={Users}
        title="Customers"
        description="Master data customer. Sector optional. At least one PIC (name) is required."
        actions={<ExportCustomersButton customers={normalized} />}
      />
      <AddCustomerPanel
        existingCustomers={normalized.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          sector: c.sector,
        }))}
      />
      <div className="table-shell">
        <CustomersTable customers={normalized} />
      </div>
    </div>
  );
}
