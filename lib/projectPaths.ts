import { slugWithId } from "@/lib/slugify";

export function projectSlugFor(project: {
  id: string;
  project_name: string;
  no_quote: string;
}) {
  return slugWithId(`${project.no_quote} ${project.project_name}`, project.id);
}

export function projectDetailPath(project: {
  slug?: string | null;
  id: string;
  project_name: string;
  no_quote: string;
}) {
  return `/dashboard/projects/${project.slug ?? projectSlugFor(project)}`;
}
