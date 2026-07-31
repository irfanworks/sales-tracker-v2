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

function idPrefixFromSlug(slug: string): string | null {
  const match = slug.match(/-([a-f0-9]{8})$/i);
  return match ? match[1].toLowerCase() : null;
}

type PipelineRow = {
  id: string;
  slug: string | null;
  no_quote: string;
  pipeline_name: string;
  [key: string]: unknown;
};

function matchesSlugParam(
  project: { id: string; no_quote: string; pipeline_name: string; slug?: string | null },
  slugParam: string
) {
  if (project.slug === slugParam) return true;
  if (pipelineSlugFor(project) === slugParam) return true;

  const prefix = idPrefixFromSlug(slugParam);
  if (prefix && project.id.replace(/-/g, "").toLowerCase().startsWith(prefix)) return true;

  return false;
}

function normalizeRpcRow(data: unknown): PipelineRow | null {
  if (!data) return null;
  if (Array.isArray(data)) return (data[0] as PipelineRow | undefined) ?? null;
  return data as PipelineRow;
}

export async function getPipelineBySlugOrId(slugOrId: string) {
  const slugParam = decodeSlugParam(slugOrId);
  const supabase = await getSupabase();

  const { data: rpcProject } = await supabase.rpc("get_pipeline_by_slug", {
    p_slug: slugParam,
  });
  const rpcRow = normalizeRpcRow(rpcProject);
  if (rpcRow?.id) return { project: rpcRow, error: null };

  const { data: bySlug } = await supabase
    .from("pipelines")
    .select("*")
    .eq("slug", slugParam)
    .maybeSingle();

  if (bySlug) return { project: bySlug, error: null };

  if (isUuid(slugParam)) {
    const { data: byId } = await supabase
      .from("pipelines")
      .select("*")
      .eq("id", slugParam)
      .maybeSingle();

    if (byId) return { project: byId, error: null };
  }

  const { data: pipelines, error: listError } = await supabase.from("pipelines").select("*");

  if (listError) {
    return { project: null, error: listError };
  }

  const matched = (pipelines ?? []).find((row) => matchesSlugParam(row, slugParam));
  return { project: matched ?? null, error: null };
}

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
