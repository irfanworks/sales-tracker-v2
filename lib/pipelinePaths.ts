import { slugWithId } from "@/lib/slugify";

export function pipelineSlugFor(project: {
  id: string;
  pipeline_name: string;
  no_quote: string;
}) {
  return slugWithId(`${project.no_quote} ${project.pipeline_name}`, project.id);
}

export function pipelineDetailPath(project: {
  slug?: string | null;
  id: string;
  pipeline_name: string;
  no_quote: string;
}) {
  return `/dashboard/pipeline/${project.slug ?? pipelineSlugFor(project)}`;
}
