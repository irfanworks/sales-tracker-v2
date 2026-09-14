import { cache } from "react";
import { getSupabase } from "@/lib/auth";
import { isUuid } from "@/lib/isUuid";
import { pipelineSlugFor } from "@/lib/pipelinePaths";

function decodeSlugParam(value: string) {
  try {
    return decodeURIComponent(value).trim();
  } catch {
    return value.trim();
  }
}

const PIPELINE_LOOKUP_SELECT =
  "id, slug, no_quote, pipeline_name, created_at, sales_id, customer_id, sales_stage, status";

type PipelineRow = {
  id: string;
  slug: string | null;
  no_quote: string;
  pipeline_name: string;
  [key: string]: unknown;
};

function normalizeRpcRow(data: unknown): PipelineRow | null {
  if (!data) return null;
  if (Array.isArray(data)) return (data[0] as PipelineRow | undefined) ?? null;
  return data as PipelineRow;
}

/** Per-request memoized lookup — shared by generateMetadata + page. */
export const getPipelineBySlugOrId = cache(async (slugOrId: string) => {
  const slugParam = decodeSlugParam(slugOrId);
  const supabase = await getSupabase();

  const { data: rpcProject } = await supabase.rpc("get_pipeline_by_slug", {
    p_slug: slugParam,
  });
  const rpcRow = normalizeRpcRow(rpcProject);
  if (rpcRow?.id) return { project: rpcRow, error: null };

  const { data: bySlug } = await supabase
    .from("pipelines")
    .select(PIPELINE_LOOKUP_SELECT)
    .eq("slug", slugParam)
    .maybeSingle();

  if (bySlug) return { project: bySlug, error: null };

  if (isUuid(slugParam)) {
    const { data: byId, error } = await supabase
      .from("pipelines")
      .select(PIPELINE_LOOKUP_SELECT)
      .eq("id", slugParam)
      .maybeSingle();

    if (byId) return { project: byId, error: null };
    return { project: null, error };
  }

  return { project: null, error: null };
});

export async function ensurePipelineSlug(project: {
  id: string;
  no_quote: string;
  pipeline_name: string;
  slug?: string | null;
}) {
  const expected = pipelineSlugFor(project);
  if (project.slug === expected) return expected;

  const supabase = await getSupabase();
  await supabase.from("pipelines").update({ slug: expected }).eq("id", project.id);
  return expected;
}
