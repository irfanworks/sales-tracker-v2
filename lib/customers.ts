import { cache } from "react";
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

type CustomerRow = {
  id: string;
  name: string;
  sector: string | null;
  customer_role: string | null;
  slug: string | null;
};

const CUSTOMER_LOOKUP_SELECT = "id, name, sector, customer_role, slug";

function normalizeRpcRow(data: unknown): CustomerRow | null {
  if (!data) return null;
  if (Array.isArray(data)) return (data[0] as CustomerRow | undefined) ?? null;
  return data as CustomerRow;
}

/** Per-request memoized lookup — shared by generateMetadata + page. */
export const getCustomerBySlugOrId = cache(async (slugOrId: string) => {
  const slugParam = decodeSlugParam(slugOrId);
  const supabase = await getSupabase();

  const { data: rpcCustomer } = await supabase.rpc("get_customer_by_slug", {
    p_slug: slugParam,
  });
  const rpcRow = normalizeRpcRow(rpcCustomer);
  if (rpcRow?.id) return { customer: rpcRow, error: null };

  const { data: bySlug } = await supabase
    .from("customers")
    .select(CUSTOMER_LOOKUP_SELECT)
    .eq("slug", slugParam)
    .maybeSingle();

  if (bySlug) return { customer: bySlug, error: null };

  if (isUuid(slugParam)) {
    const { data: byId, error } = await supabase
      .from("customers")
      .select(CUSTOMER_LOOKUP_SELECT)
      .eq("id", slugParam)
      .maybeSingle();

    if (byId) return { customer: byId, error: null };
    return { customer: null, error };
  }

  return { customer: null, error: null };
});

export async function ensureCustomerSlug(
  customer: { id: string; name: string; slug?: string | null }
) {
  const expected = slugWithId(customer.name, customer.id);
  if (customer.slug === expected) return expected;

  const supabase = await getSupabase();
  await supabase.from("customers").update({ slug: expected }).eq("id", customer.id);
  return expected;
}
