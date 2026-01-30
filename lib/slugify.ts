/**
 * Human-readable slug: lowercase, spaces to hyphens, remove non-alphanumeric.
 */
export function slugify(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    || "item";
}

export function slugWithId(s: string, id: string): string {
  const base = slugify(s);
  const shortId = id.replace(/-/g, "").slice(0, 8);
  return base ? `${base}-${shortId}` : shortId;
}
