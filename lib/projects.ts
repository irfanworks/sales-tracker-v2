import { getSupabase } from "@/lib/auth";
import { isUuid } from "@/lib/isUuid";
import { projectSlugFor } from "@/lib/projectPaths";

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

type ProjectRow = {
  id: string;
  slug: string | null;
  no_quote: string;
  project_name: string;
  [key: string]: unknown;
};

function matchesSlugParam(
  project: { id: string; no_quote: string; project_name: string; slug?: string | null },
  slugParam: string
) {
  if (project.slug === slugParam) return true;
  if (projectSlugFor(project) === slugParam) return true;

  const prefix = idPrefixFromSlug(slugParam);
  if (prefix && project.id.replace(/-/g, "").toLowerCase().startsWith(prefix)) return true;

  return false;
}

function normalizeRpcRow(data: unknown): ProjectRow | null {
  if (!data) return null;
  if (Array.isArray(data)) return (data[0] as ProjectRow | undefined) ?? null;
  return data as ProjectRow;
}

export async function getProjectBySlugOrId(slugOrId: string) {
  const slugParam = decodeSlugParam(slugOrId);
  const supabase = await getSupabase();

  const { data: rpcProject } = await supabase.rpc("get_project_by_slug", {
    p_slug: slugParam,
  });
  const rpcRow = normalizeRpcRow(rpcProject);
  if (rpcRow?.id) return { project: rpcRow, error: null };

  const { data: bySlug } = await supabase
    .from("projects")
    .select("*")
    .eq("slug", slugParam)
    .maybeSingle();

  if (bySlug) return { project: bySlug, error: null };

  if (isUuid(slugParam)) {
    const { data: byId } = await supabase
      .from("projects")
      .select("*")
      .eq("id", slugParam)
      .maybeSingle();

    if (byId) return { project: byId, error: null };
  }

  const { data: projects, error: listError } = await supabase.from("projects").select("*");

  if (listError) {
    return { project: null, error: listError };
  }

  const matched = (projects ?? []).find((project) => matchesSlugParam(project, slugParam));
  return { project: matched ?? null, error: null };
}

export async function ensureProjectSlug(project: {
  id: string;
  no_quote: string;
  project_name: string;
  slug?: string | null;
}) {
  const expected = projectSlugFor(project);
  if (project.slug === expected) return expected;

  const supabase = await getSupabase();
  await supabase.from("projects").update({ slug: expected }).eq("id", project.id);
  return expected;
}
