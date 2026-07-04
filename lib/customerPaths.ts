import { slugWithId } from "@/lib/slugify";

export function customerDetailPath(customer: { slug?: string | null; id: string; name: string }) {
  return `/dashboard/customers/${customer.slug ?? slugWithId(customer.name, customer.id)}`;
}

export function customerSlugFor(customer: { id: string; name: string }) {
  return slugWithId(customer.name, customer.id);
}
