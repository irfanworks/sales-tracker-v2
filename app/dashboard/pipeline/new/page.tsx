import { createClient } from "@/lib/supabase/server";
import { PipelineForm } from "@/components/PipelineForm";
import { PROGRESS_TYPES, PROSPECT_OPTIONS } from "@/lib/types/database";

export default async function NewPipelinePage() {
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
    <div className="mx-auto w-full min-w-0 max-w-3xl space-y-5 overflow-x-clip sm:space-y-6 2xl:max-w-4xl">
      <header className="pipeline-page-header px-0.5">
        <p className="pipeline-page-kicker">Pipeline</p>
        <h1 className="pipeline-page-title">New Pipeline</h1>
        <p className="pipeline-page-desc">
          Capture a new opportunity with clear commercial terms — designed for speed without
          sacrificing clarity.
        </p>
      </header>
      <div className="pipeline-form-card p-4 sm:p-6 md:p-8">
        <PipelineForm
          customers={normalized}
          progressTypes={PROGRESS_TYPES}
          prospectOptions={PROSPECT_OPTIONS}
        />
      </div>
    </div>
  );
}
