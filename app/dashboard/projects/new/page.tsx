import { createClient } from "@/lib/supabase/server";
import { ProjectForm } from "@/components/ProjectForm";
import { PROGRESS_TYPES, PROSPECT_OPTIONS } from "@/lib/types/database";

export default async function NewProjectPage() {
  const supabase = await createClient();
  const { data: customers } = await supabase
    .from("customers")
    .select("id, name, customer_pics ( id, nama )")
    .order("name");

  const normalized = (customers ?? []).map((c) => ({
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
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">New Project</h1>
        <p className="mt-1 text-slate-600">Add a new sales project.</p>
      </div>
      <div className="card p-6">
        <ProjectForm
          customers={normalized}
          progressTypes={PROGRESS_TYPES}
          prospectOptions={PROSPECT_OPTIONS}
        />
      </div>
    </div>
  );
}
