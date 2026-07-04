import { getSupabase } from "@/lib/auth";
import { isUuid } from "@/lib/isUuid";
import { slugWithId } from "@/lib/slugify";

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

function matchesSlugParam(
  customer: { id: string; name: string; slug?: string | null },
  slugParam: string
) {
  if (customer.slug === slugParam) return true;
  if (slugWithId(customer.name, customer.id) === slugParam) return true;

  const prefix = idPrefixFromSlug(slugParam);
  if (prefix && customer.id.replace(/-/g, "").toLowerCase().startsWith(prefix)) return true;

  return false;
}

type CustomerRow = { id: string; name: string; sector: string | null; slug: string | null };

function normalizeRpcRow(data: unknown): CustomerRow | null {
  if (!data) return null;
  if (Array.isArray(data)) return (data[0] as CustomerRow | undefined) ?? null;
  return data as CustomerRow;
}

export async function getCustomerBySlugOrId(slugOrId: string) {
  const slugParam = decodeSlugParam(slugOrId);
  const supabase = await getSupabase();

  const { data: rpcCustomer } = await supabase.rpc("get_customer_by_slug", {
    p_slug: slugParam,
  });
  const rpcRow = normalizeRpcRow(rpcCustomer);
  if (rpcRow?.id) return { customer: rpcRow, error: null };

  const { data: bySlug } = await supabase
    .from("customers")
    .select("id, name, sector, slug")
    .eq("slug", slugParam)
    .maybeSingle();

  if (bySlug) return { customer: bySlug, error: null };

  if (isUuid(slugParam)) {
    const { data: byId } = await supabase
      .from("customers")
      .select("id, name, sector, slug")
      .eq("id", slugParam)
      .maybeSingle();

    if (byId) return { customer: byId, error: null };
  }

  const { data: customers, error: listError } = await supabase
    .from("customers")
    .select("id, name, sector, slug");

  if (listError) {
    return { customer: null, error: listError };
  }

  const matched = (customers ?? []).find((customer) => matchesSlugParam(customer, slugParam));
  return { customer: matched ?? null, error: null };
}

export async function ensureCustomerSlug(
  customer: { id: string; name: string; slug?: string | null }
) {
  const expected = slugWithId(customer.name, customer.id);
  if (customer.slug === expected) return expected;

  const supabase = await getSupabase();
  await supabase.from("customers").update({ slug: expected }).eq("id", customer.id);
  return expected;
}
